/**
 * Scan Details Screen
 * Displays comprehensive disease analysis results
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { Screen, Text, IconButton } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useScans } from '@/features/scans/useScans';

export default function ScanDetailsScreen() {
    const { colors, spacing } = useTheme();
    const router = useRouter();
    const { scanId } = useLocalSearchParams<{ scanId: string }>();
    const { scans } = useScans(100); // Get all scans to find the one we need

    const scan = useMemo(() => {
        return scans.find((s) => s.id === scanId);
    }, [scans, scanId]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.md,
                },
                title: {
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.text,
                },
                card: {
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: spacing.lg,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    gap: spacing.md,
                },
                sectionTitle: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: spacing.sm,
                },
                sectionContent: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 22,
                },
                listItem: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                    marginBottom: spacing.xs,
                },
                bullet: {
                    color: colors.primary,
                    marginTop: 6,
                },
                confidenceBadge: {
                    alignSelf: 'flex-start',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: 20,
                    backgroundColor: colors.primary + '20',
                },
                confidenceText: {
                    color: colors.primary,
                    fontWeight: '600',
                    fontSize: 14,
                },
                statusPill: {
                    alignSelf: 'flex-start',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs / 2,
                    borderRadius: 12,
                    backgroundColor: colors.success + '20',
                },
                statusText: {
                    fontSize: 12,
                    color: colors.success,
                    fontWeight: '600',
                },
                warningBox: {
                    backgroundColor: colors.warning + '15',
                    borderRadius: 12,
                    padding: spacing.md,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.warning,
                },
                warningText: {
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '500',
                },
            }),
        [colors, spacing]
    );

    if (!scan) {
        return (
            <Screen scrollable contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Scan Not Found</Text>
                    <IconButton
                        icon={<FontAwesome name="close" size={18} color={colors.text} />}
                        onPress={() => router.back()}
                        size="medium"
                        variant="outlined"
                    />
                </View>
                <Text>This scan could not be found.</Text>
            </Screen>
        );
    }

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Disease Analysis</Text>
                <IconButton
                    icon={<FontAwesome name="close" size={18} color={colors.text} />}
                    onPress={() => router.back()}
                    size="medium"
                    variant="outlined"
                />
            </View>

            {/* Disease Name & Confidence */}
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>
                            {scan.predictedDisease || 'Analysis Pending'}
                        </Text>
                        {scan.status === 'success' && (
                            <View style={styles.statusPill}>
                                <Text style={styles.statusText}>ANALYZED</Text>
                            </View>
                        )}
                    </View>
                    {scan.confidenceScore && (
                        <View style={[
                            styles.confidenceBadge,
                            scan.isLowConfidence && {
                                backgroundColor: colors.warning + '20',
                            }
                        ]}>
                            <Text style={[
                                styles.confidenceText,
                                scan.isLowConfidence && { color: colors.warning }
                            ]}>
                                {Math.round(scan.confidenceScore * 100)}% Confidence
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Low Confidence Warning */}
            {scan.isLowConfidence && scan.confidenceWarning && (
                <View style={[styles.card, {
                    backgroundColor: colors.warning + '15',
                    borderLeftWidth: 4,
                    borderLeftColor: colors.warning,
                }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <FontAwesome name="exclamation-circle" size={18} color={colors.warning} />
                        <Text style={[styles.sectionTitle, { color: colors.warning }]}>Uncertain Result</Text>
                    </View>
                    <Text style={[styles.sectionContent, { color: colors.text }]}>
                        {scan.confidenceWarning}
                    </Text>
                </View>
            )}

            {/* Multiple Disease Possibilities (Low Confidence) */}
            {scan.isLowConfidence && scan.allPredictions && (
                <View style={[styles.card, {
                    backgroundColor: colors.warning + '10',
                    borderLeftWidth: 4,
                    borderLeftColor: colors.warning,
                }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <FontAwesome name="question-circle" size={18} color={colors.warning} />
                        <Text style={[styles.sectionTitle, { color: colors.warning }]}>Possible Conditions</Text>
                    </View>
                    <Text style={[styles.sectionContent, { marginBottom: spacing.md }]}>
                        The image quality or clarity may be affecting the analysis. Based on the model predictions, this could be one of the following conditions:
                    </Text>
                    {Object.entries(scan.allPredictions)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([disease, prob]) => (
                            <View key={disease} style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: spacing.xs,
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: colors.border,
                            }}>
                                <Text style={styles.sectionContent}>{disease}</Text>
                                <Text style={[styles.sectionContent, { fontWeight: '600', color: colors.primary }]}>
                                    {(prob * 100).toFixed(1)}%
                                </Text>
                            </View>
                        ))}
                    <Text style={[styles.sectionContent, { marginTop: spacing.md, fontStyle: 'italic', color: colors.warning }]}>
                        Please upload a clearer, well-lit image for more accurate results.
                    </Text>
                </View>
            )}

            {/* Detailed Alternate Diseases */}
            {scan.isLowConfidence && scan.alternateDiseases && scan.alternateDiseases.length > 0 && (
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <FontAwesome name="stethoscope" size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Learn More About Possible Conditions</Text>
                    </View>
                    {scan.alternateDiseases.map((alt, index) => (
                        <View
                            key={`${alt.name}-${index}`}
                            style={{
                                paddingVertical: spacing.sm,
                                borderBottomWidth: index === scan.alternateDiseases.length - 1 ? 0 : StyleSheet.hairlineWidth,
                                borderBottomColor: colors.border,
                                gap: spacing.xs,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                    {alt.name}
                                </Text>
                                <View style={{
                                    paddingHorizontal: spacing.sm,
                                    paddingVertical: spacing.xs / 2,
                                    borderRadius: 12,
                                    backgroundColor: colors.primary + '15',
                                }}>
                                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                                        {(alt.probability * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            </View>

                            {alt.description ? (
                                <Text style={styles.sectionContent}>{alt.description}</Text>
                            ) : null}

                            {alt.symptoms && alt.symptoms.length > 0 && (
                                <View>
                                    <Text style={[styles.sectionContent, { fontWeight: '600', marginTop: spacing.xs }]}>
                                        Common symptoms:
                                    </Text>
                                    {alt.symptoms.map((symptom, idx) => (
                                        <View key={idx} style={styles.listItem}>
                                            <FontAwesome name="circle" size={6} color={colors.primary} style={styles.bullet} />
                                            <Text style={[styles.sectionContent, { flex: 1 }]}>{symptom}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {alt.treatmentSuggestion ? (
                                <View>
                                    <Text style={[styles.sectionContent, { fontWeight: '600', marginTop: spacing.xs }]}>
                                        Treatment & care:
                                    </Text>
                                    <Text style={styles.sectionContent}>{alt.treatmentSuggestion}</Text>
                                </View>
                            ) : null}

                            {alt.precautions && alt.precautions.length > 0 && (
                                <View>
                                    <Text style={[styles.sectionContent, { fontWeight: '600', marginTop: spacing.xs }]}>
                                        Precautions:
                                    </Text>
                                    {alt.precautions.map((precaution, idx) => (
                                        <View key={idx} style={styles.listItem}>
                                            <FontAwesome name="shield" size={12} color={colors.warning} style={styles.bullet} />
                                            <Text style={[styles.sectionContent, { flex: 1 }]}>{precaution}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {alt.whenToSeeDoctor ? (
                                <View style={{ marginTop: spacing.xs }}>
                                    <Text style={[styles.sectionContent, { fontWeight: '600' }]}>
                                        When to see a doctor:
                                    </Text>
                                    <Text style={styles.sectionContent}>{alt.whenToSeeDoctor}</Text>
                                </View>
                            ) : null}
                        </View>
                    ))}
                </View>
            )}

            {/* Disease Description - Show for all scans (from Gemini) */}
            {scan.diseaseDescription && (
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <FontAwesome name="info-circle" size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Description</Text>
                        {scan.isLowConfidence && (
                            <Text style={{ fontSize: 10, color: colors.warning, fontStyle: 'italic' }}>
                                (Generic info due to low confidence)
                            </Text>
                        )}
                    </View>
                    <Text style={styles.sectionContent}>{scan.diseaseDescription}</Text>
                </View>
            )}

            {/* Symptoms - Show for all scans (from Gemini) */}
            {scan.symptoms && scan.symptoms.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Symptoms</Text>
                    {scan.symptoms.map((symptom, index) => (
                        <View key={index} style={styles.listItem}>
                            <FontAwesome name="circle" size={6} color={colors.primary} style={styles.bullet} />
                            <Text style={[styles.sectionContent, { flex: 1 }]}>{symptom}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Treatment/Cure - Show for all scans (from Gemini) */}
            {scan.treatmentSuggestion && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Treatment & Care</Text>
                    <Text style={styles.sectionContent}>{scan.treatmentSuggestion}</Text>
                </View>
            )}

            {/* Precautions - Show for all scans (from Gemini) */}
            {scan.precautions && scan.precautions.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Precautions</Text>
                    {scan.precautions.map((precaution, index) => (
                        <View key={index} style={styles.listItem}>
                            <FontAwesome name="shield" size={12} color={colors.primary} style={styles.bullet} />
                            <Text style={[styles.sectionContent, { flex: 1 }]}>{precaution}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* When to See Doctor - Show for all scans (from Gemini) */}
            {scan.whenToSeeDoctor && (
                <View style={[styles.card, {
                    backgroundColor: colors.error + '10',
                    borderLeftWidth: 4,
                    borderLeftColor: colors.error,
                }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <FontAwesome name="hospital-o" size={16} color={colors.error} />
                        <Text style={[styles.sectionTitle, { color: colors.error }]}>When to See a Doctor</Text>
                    </View>
                    <Text style={styles.sectionContent}>{scan.whenToSeeDoctor}</Text>
                </View>
            )}

            {/* When to See Doctor */}
            <View style={[styles.card, styles.warningBox]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <FontAwesome name="exclamation-triangle" size={16} color={colors.warning} />
                    <Text style={styles.sectionTitle}>Important</Text>
                </View>
                <Text style={styles.warningText}>
                    This analysis is for informational purposes only. Please consult a qualified dermatologist for
                    proper diagnosis and treatment, especially for serious conditions like BCC, SCC, or Melanoma.
                </Text>
            </View>

            {/* Scan Metadata */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Scan Information</Text>
                <View style={{ gap: spacing.xs }}>
                    <Text style={styles.sectionContent}>
                        <Text style={{ fontWeight: '600' }}>Captured:</Text>{' '}
                        {scan.capturedAtDate?.toLocaleString() || 'N/A'}
                    </Text>
                    <Text style={styles.sectionContent}>
                        <Text style={{ fontWeight: '600' }}>Status:</Text> {scan.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                    {scan.modelVersion && (
                        <Text style={styles.sectionContent}>
                            <Text style={{ fontWeight: '600' }}>Model Version:</Text> {scan.modelVersion}
                        </Text>
                    )}
                </View>
            </View>
        </Screen>
    );
}

