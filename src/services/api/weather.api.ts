/**
 * Weather Prediction API Service
 * Handles communication with FastAPI backend for weather-based disease predictions
 */
import axios, { AxiosInstance } from 'axios';
import { API_ENDPOINTS, WeatherPredictionRequest, WeatherPredictionResponse } from './api.config';

class WeatherAPIService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_ENDPOINTS.BASE_URL,
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get weather-based disease predictions for a location
     */
    async getWeatherPredictions(
        request: WeatherPredictionRequest
    ): Promise<WeatherPredictionResponse> {
        try {
            const response = await this.client.post<WeatherPredictionResponse>(
                API_ENDPOINTS.WEATHER.PREDICT,
                request
            );

            return response.data;
        } catch (error: any) {
            console.error('Error fetching weather predictions:', error);
            if (error.response) {
                throw new Error(error.response.data.detail || 'Failed to get weather predictions');
            }
            throw new Error('Network error. Please check your connection.');
        }
    }
}

export const weatherAPIService = new WeatherAPIService();



