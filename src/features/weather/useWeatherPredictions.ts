/**
 * Hook for fetching weather-based skin disease predictions
 */
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { weatherAPIService } from '@/services/api/weather.api';
import { WeatherPredictionResponse } from '@/services/api/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_STORAGE_KEY = '@weather_location';
const COORDS_STORAGE_KEY = '@weather_coordinates';

export interface StoredLocation {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
}

export function useWeatherPredictions() {
    const [prediction, setPrediction] = useState<WeatherPredictionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<StoredLocation | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Load saved location on mount
    useEffect(() => {
        loadSavedLocation();
    }, []);

    const loadSavedLocation = useCallback(async () => {
        try {
            const savedCoords = await AsyncStorage.getItem(COORDS_STORAGE_KEY);
            if (savedCoords) {
                const coords = JSON.parse(savedCoords);
                setLocation(coords);
            }
        } catch (error) {
            console.error('Failed to load saved location:', error);
        }
    }, []);

    const saveLocation = useCallback(async (coords: StoredLocation) => {
        try {
            await AsyncStorage.setItem(COORDS_STORAGE_KEY, JSON.stringify(coords));
            setLocation(coords);
        } catch (error) {
            console.error('Failed to save location:', error);
        }
    }, []);

    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            
            if (existingStatus === 'granted') {
                setHasPermission(true);
                return true;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status === 'granted') {
                setHasPermission(true);
                return true;
            } else {
                setHasPermission(false);
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location access in your device settings to get weather-based skin health recommendations.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setHasPermission(false);
            return false;
        }
    }, []);

    const getCurrentLocation = useCallback(async (): Promise<StoredLocation | null> => {
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                return null;
            }

            setIsLoading(true);
            setError(null);

            const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = locationData.coords;

            // Try to get reverse geocoding for city/country
            let city: string | undefined;
            let country: string | undefined;

            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

                if (reverseGeocode && reverseGeocode.length > 0) {
                    city = reverseGeocode[0].city || reverseGeocode[0].subAdministrativeArea;
                    country = reverseGeocode[0].country;
                }
            } catch (geocodeError) {
                console.warn('Reverse geocoding failed:', geocodeError);
                // Continue without city/country
            }

            const coords: StoredLocation = {
                latitude,
                longitude,
                city,
                country,
            };

            await saveLocation(coords);
            return coords;
        } catch (error: any) {
            console.error('Error getting current location:', error);
            setError('Failed to get your location. Please try again.');
            Alert.alert('Location Error', 'Unable to get your current location. Please check your location settings.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [requestLocationPermission, saveLocation]);

    const fetchWeatherPredictions = useCallback(async (coords?: StoredLocation) => {
        try {
            setIsLoading(true);
            setError(null);

            // Use provided coords or saved location
            const locationToUse = coords || location;

            if (!locationToUse) {
                // No location available, request it
                const newLocation = await getCurrentLocation();
                if (!newLocation) {
                    setError('Location is required to get weather predictions.');
                    return;
                }
                locationToUse = newLocation;
            }

            console.log('[Weather] Fetching predictions from Gemini API for location:', locationToUse);
            const response = await weatherAPIService.getWeatherPredictions({
                latitude: locationToUse.latitude,
                longitude: locationToUse.longitude,
                city: locationToUse.city,
                country: locationToUse.country,
            });

            console.log('[Weather] Gemini-generated content received:', {
                hasDiseases: response.potential_diseases?.length > 0,
                diseaseCount: response.potential_diseases?.length || 0,
                diseases: response.potential_diseases?.map(d => d.name) || [],
                hasRecommendations: response.recommendations?.length > 0,
                hasPrecautions: response.precautions?.length > 0,
            });
            setPrediction(response);
        } catch (err: any) {
            console.error('Failed to fetch weather predictions:', err);
            setError(err.message || 'Failed to get weather predictions. Please try again.');
            Alert.alert('Error', err.message || 'Failed to get weather predictions. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    }, [location, getCurrentLocation]);

    const changeLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        // Clear previous prediction to show loading state
        setPrediction(null);
        
        const newLocation = await getCurrentLocation();
        if (newLocation) {
            // Fetch new weather predictions with new location
            // This will get new weather data and generate new disease predictions
            await fetchWeatherPredictions(newLocation);
        } else {
            setIsLoading(false);
        }
    }, [getCurrentLocation, fetchWeatherPredictions]);

    return {
        prediction,
        isLoading,
        error,
        location,
        hasPermission,
        fetchWeatherPredictions,
        changeLocation,
        getCurrentLocation,
    };
}
