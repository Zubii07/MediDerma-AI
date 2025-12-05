import React, { useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, LoadingSpinner, Button } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { Section } from '@/components/dashboard/Section';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useWeatherPredictions } from '@/features/weather/useWeatherPredictions';

export default function NotificationsTabScreen() {
    const { colors, spacing } = useTheme();
    const {
        prediction,
        isLoading,
        error,
        location,
        fetchWeatherPredictions,
        changeLocation,
        getCurrentLocation,
    } = useWeatherPredictions();

    // Request location and fetch weather when screen opens
    useFocusEffect(
        useCallback(() => {
            // Only fetch if we don't have a prediction yet
            if (!prediction && !isLoading) {
                // Check if we have saved location, if not request it
                if (location) {
                    fetchWeatherPredictions();
                } else {
                    // Request location permission and get current location
                    getCurrentLocation().then((coords) => {
                        if (coords) {
                            fetchWeatherPredictions(coords);
                        }
                    });
                }
            }
        }, [prediction, isLoading, location, fetchWeatherPredictions, getCurrentLocation])
    );

    const handleChangeLocation = useCallback(async () => {
        await changeLocation();
    }, [changeLocation]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                card: {
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                },
                locationCard: {
                    backgroundColor: colors.primary + '15',
                    borderRadius: 12,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                },
                locationText: {
                    flex: 1,
                },
                changeLocationButton: {
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 8,
                },
                riskBadge: {
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                    marginTop: spacing.xs,
                },
                diseaseCard: {
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                    borderLeftWidth: 3,
                },
                listItem: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                    marginBottom: spacing.xs,
                },
                bullet: {
                    marginTop: 6,
                },
            }),
        [colors, spacing]
    );

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high':
                return colors.error;
            case 'moderate':
                return colors.warning;
            case 'low':
                return colors.success || colors.primary;
            default:
                return colors.textSecondary;
        }
    };

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Section
                title="Weather Alerts"
                subtitle="Personalized skin health tips based on your location and weather conditions."
                action={<FontAwesome name="cloud" size={20} color={colors.primary} />}
            >
                {isLoading ? (
                    <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                        <LoadingSpinner size="small" />
                        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>
                            Getting your location and weather data...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.card}>
                        <Text style={{ color: colors.error, marginBottom: spacing.sm }}>
                            {error}
                        </Text>
                        <Button
                            title="Try Again"
                            onPress={() => {
                                getCurrentLocation().then((coords) => {
                                    if (coords) {
                                        fetchWeatherPredictions(coords);
                                    }
                                });
                            }}
                            variant="outline"
                        />
                    </View>
                ) : prediction ? (
                    <View>
                        {/* Location Display */}
                        {location && (
                            <View style={styles.locationCard}>
                                <View style={styles.locationText}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs }}>
                                        Current Location
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                        {location.city || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                        {location.country && `, ${location.country}`}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.changeLocationButton}
                                    onPress={handleChangeLocation}
                                >
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                        Change
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Weather Info */}
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                    Current Weather
                                </Text>
                                <FontAwesome name="thermometer-half" size={18} color={colors.primary} />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs }}>
                                {Math.round(prediction.weather.temperature)}°C
                            </Text>
                            {prediction.weather.feels_like && (
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs }}>
                                    Feels like {Math.round(prediction.weather.feels_like)}°C
                                </Text>
                            )}
                            <Text style={{ fontSize: 14, color: colors.text, textTransform: 'capitalize', marginBottom: spacing.xs }}>
                                {prediction.weather.conditions}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                Humidity: {prediction.weather.humidity}%
                            </Text>
                        </View>

                        {/* Risk Assessment */}
                        <View style={styles.card}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
                                Risk Assessment
                            </Text>
                            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(prediction.risk_assessment.overall_risk) + '20' }]}>
                                <Text style={{ color: getRiskColor(prediction.risk_assessment.overall_risk), fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
                                    {prediction.risk_assessment.overall_risk} Risk
                                </Text>
                            </View>
                            {prediction.risk_assessment.humidity_impact && (
                                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 }}>
                                    {prediction.risk_assessment.humidity_impact}
                                </Text>
                            )}
                        </View>

                        {/* Potential Diseases - Temperature-based */}
                        {prediction.potential_diseases && prediction.potential_diseases.length > 0 && (
                            <View style={styles.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                                    <FontAwesome name="exclamation-triangle" size={16} color={colors.warning} />
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                        Potential Skin Conditions
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' }}>
                                    Based on current temperature ({Math.round(prediction.weather.temperature)}°C) and weather conditions
                                </Text>
                                {prediction.potential_diseases.map((disease, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.diseaseCard,
                                            { borderLeftColor: getRiskColor(disease.risk) },
                                            { marginBottom: spacing.xs },
                                        ]}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                                {disease.name}
                                            </Text>
                                            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(disease.risk) + '20' }]}>
                                                <Text style={{ color: getRiskColor(disease.risk), fontSize: 10, fontWeight: '600' }}>
                                                    {disease.risk}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                                            {disease.reason}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Recommendations - Temperature-specific */}
                        {prediction.recommendations && prediction.recommendations.length > 0 && (
                            <View style={styles.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                                    <FontAwesome name="lightbulb-o" size={16} color={colors.primary} />
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                        Recommendations
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' }}>
                                    Tailored for {Math.round(prediction.weather.temperature)}°C conditions
                                </Text>
                                {prediction.recommendations.map((rec, index) => (
                                    <View key={index} style={styles.listItem}>
                                        <FontAwesome name="check-circle" size={14} color={colors.primary} style={styles.bullet} />
                                        <Text style={{ flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 }}>
                                            {rec}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Precautions - Location-specific */}
                        {prediction.precautions && prediction.precautions.length > 0 && (
                            <View style={styles.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                                    <FontAwesome name="shield" size={16} color={colors.warning} />
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                        Precautions
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' }}>
                                    Specific to {location?.city || 'your location'} weather conditions
                                </Text>
                                {prediction.precautions.map((precaution, index) => (
                                    <View key={index} style={styles.listItem}>
                                        <FontAwesome name="shield" size={14} color={colors.warning} style={styles.bullet} />
                                        <Text style={{ flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 }}>
                                            {precaution}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <EmptyState
                        icon="sun-o"
                        message="Enable location access to get personalized weather-based skin health recommendations."
                    />
                )}
            </Section>

            <Section
                title="UV & Air Quality Insights"
                subtitle="Protective guidance derived from UV index and pollutants."
            >
                <EmptyState
                    icon="line-chart"
                    message="AI-driven alerts are on the way. Check back after the next release."
                />
            </Section>
        </Screen>
    );
}
