import React, { useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';

import { Screen, Text, LoadingSpinner } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { Section } from '@/components/dashboard/Section';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useUploadScan } from '@/features/scans/useUploadScan';
import { useScans } from '@/features/scans/useScans';
import { useRecommendations } from '@/features/recommendations/useRecommendations';
import { useRouter } from 'expo-router';
import { useProfileCompletionGuard } from '@/hooks/useProfileCompletionGuard';

export default function HomeTabScreen() {
    const { colors, spacing } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { uploadScan, isUploading } = useUploadScan();
    const { isProfileComplete, ensureProfileComplete } = useProfileCompletionGuard();
    const { latestScan, isLoading: isLoadingScans, fetchPage, clearCache, fetchTotalCount, refresh } = useScans(1, {
        enabled: isProfileComplete,
    });
    const { recommendations, isLoading: isLoadingRecommendations, refresh: refreshRecommendations } = useRecommendations();

    // Refresh scans when screen comes into focus (e.g., after deleting from history)
    // Note: Latest scan is independent and won't auto-refresh
    useFocusEffect(
        useCallback(() => {
            if (isProfileComplete) {
                clearCache();
                fetchTotalCount();
                fetchPage(1, 1);
                // Recommendations will auto-update only when totalCount changes (scan added/deleted)
            }
        }, [clearCache, fetchPage, fetchTotalCount, isProfileComplete])
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                quickActions: {
                    flexDirection: 'row',
                    gap: spacing.md,
                },
                actionCard: {
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    alignItems: 'center',
                    gap: spacing.sm,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                },
                actionText: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    textAlign: 'center',
                },
            }),
        [colors, spacing]
    );

    const latestScanTimestamp = useMemo(() => {
        if (!latestScan) return null;
        return (
            latestScan.capturedAtDate ??
            latestScan.createdAtDate ??
            latestScan.updatedAtDate ??
            null
        );
    }, [latestScan]);

    const greetingName = useMemo(() => {
        if (user?.displayName) return user.displayName.toLocaleUpperCase();
        if (user?.email) return user.email.split('@')[0];
        return 'Explorer';
    }, [user]);

    const pickImage = useCallback(
        async (source: 'camera' | 'library') => {
            if (!ensureProfileComplete('upload a scan')) {
                return;
            }
            try {
                if (source === 'camera') {
                    const permission = await ImagePicker.requestCameraPermissionsAsync();
                    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
                        Alert.alert('Permission Required', 'Camera access is needed to capture a new scan.');
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                    });
                    if (!result.canceled) {
                        const uploaded = await uploadScan(result.assets[0]);
                        if (uploaded) {
                            clearCache();
                            await fetchTotalCount(); // This will trigger recommendations refresh via totalCount change
                            await fetchPage(1, 1);
                            Alert.alert('Scan Uploaded', 'Your photo has been uploaded. Analysis will appear shortly.');
                        }
                    }
                } else {
                    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
                        Alert.alert('Permission Required', 'Media library access is needed to upload a scan.');
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                    });
                    if (!result.canceled) {
                        const uploaded = await uploadScan(result.assets[0]);
                        if (uploaded) {
                            clearCache();
                            await fetchTotalCount(); // This will trigger recommendations refresh via totalCount change
                            await fetchPage(1, 1);
                            if (uploaded.analysis?.is_low_confidence) {
                                Alert.alert(
                                    'Scan Uploaded - Low Confidence',
                                    uploaded.analysis.confidence_warning || 'The image quality may be affecting the analysis. Please upload a clearer image for better results.',
                                    [{ text: 'OK' }]
                                );
                            } else {
                                Alert.alert('Scan Uploaded', 'Your selected image has been uploaded. Analysis will appear shortly.');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Image selection error:', error);
                Alert.alert('Upload Failed', 'We were unable to access your media. Please try again.');
            }
        },
        [clearCache, ensureProfileComplete, fetchPage, fetchTotalCount, uploadScan]
    );

    const handleUploadScan = useCallback(() => {
        if (!ensureProfileComplete('upload a scan')) {
            return;
        }
        Alert.alert('Upload Scan', 'Choose how you would like to add a new scan.', [
            {
                text: 'Take Photo',
                onPress: () => pickImage('camera'),
            },
            {
                text: 'Choose from Library',
                onPress: () => pickImage('library'),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }, [ensureProfileComplete, pickImage]);

    const handleViewHistory = useCallback(() => {
        if (!ensureProfileComplete('view scan history')) {
            return;
        }
        router.push('/scan-history');
    }, [ensureProfileComplete, router]);

    const uploadDisabled = !isProfileComplete || isUploading;
    const historyDisabled = !isProfileComplete;

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Section
                title={`Welcome, ${greetingName}`}
                subtitle="Here is a snapshot of your dermatology insights."
            >
                <Text style={{ color: colors.textSecondary }}>
                    Upload your first skin scan to unlock AI-powered diagnostics, treatment suggestions, and weather-aware
                    guidance tailored to you.
                </Text>
            </Section>

            <Section title="Latest Scan" subtitle="Insights from your most recent skin analysis.">
                {!isProfileComplete ? (
                    <EmptyState
                        icon="lock"
                        message="Complete your demographic profile to unlock scan insights."
                    />
                ) : isLoadingScans ? (
                    <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                        <LoadingSpinner size="small" />
                        <Text color="textSecondary">Fetching your latest scan…</Text>
                    </View>
                ) : latestScan ? (
                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderRadius: 20,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: colors.border,
                            padding: spacing.lg,
                            gap: spacing.sm,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.06,
                            shadowRadius: 12,
                            elevation: 2,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <FontAwesome name="camera" size={18} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                                Most Recent Scan
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                                Status: {latestScan.status?.toUpperCase() ?? 'PENDING'}
                            </Text>
                            {latestScan.confidenceScore && (
                                <View style={{
                                    paddingHorizontal: spacing.sm,
                                    paddingVertical: spacing.xs / 2,
                                    borderRadius: 12,
                                    backgroundColor: latestScan.isLowConfidence 
                                        ? colors.warning + '20' 
                                        : colors.primary + '20',
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: latestScan.isLowConfidence ? colors.warning : colors.primary,
                                    }}>
                                        {Math.round(latestScan.confidenceScore * 100)}%
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ color: colors.textSecondary }}>
                            Captured: {latestScanTimestamp ? latestScanTimestamp.toLocaleString() : 'Awaiting timestamp'}
                        </Text>
                        {latestScan.isLowConfidence && (
                            <View style={{
                                marginTop: spacing.xs,
                                padding: spacing.sm,
                                backgroundColor: colors.warning + '15',
                                borderRadius: 8,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.warning,
                            }}>
                                <Text style={{ fontSize: 12, color: colors.text }}>
                                    ⚠️ Image may be unclear. Upload a clearer image for better results.
                                </Text>
                            </View>
                        )}
                        <View
                            style={{
                                marginTop: spacing.sm,
                                width: '100%',
                                aspectRatio: 1.6,
                                borderRadius: 16,
                                backgroundColor: colors.surface,
                                overflow: 'hidden',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {latestScan.imageUrl ? (
                                <Image
                                    source={{ uri: latestScan.imageUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <FontAwesome name="image" size={28} color={colors.textSecondary} />
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={handleViewHistory}
                            style={{
                                marginTop: spacing.sm,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.xs,
                            }}
                        >
                            <FontAwesome name="history" size={14} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>View detailed history</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <EmptyState
                        icon="camera"
                        message="You haven't scanned any images yet. Tap 'Upload Scan' to get started."
                    />
                )}
            </Section>

            <Section title="Quick Actions" subtitle="Access the most common workflows.">
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionCard, uploadDisabled && { opacity: 0.35 }]}
                        onPress={handleUploadScan}
                        disabled={uploadDisabled}
                    >
                        <FontAwesome name="cloud-upload" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>
                            {isUploading ? 'Uploading…' : 'Upload Scan'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionCard, historyDisabled && { opacity: 0.35 }]}
                        onPress={handleViewHistory}
                        disabled={historyDisabled}
                    >
                        <FontAwesome name="history" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>View History</Text>
                    </TouchableOpacity>
                </View>
            </Section>

            <Section
                title="Recommended Actions"
                subtitle="AI-powered personalized recommendations from Gemini based on your scan history."
                action={
                    recommendations && recommendations.recommendations.length > 0 ? (
                        <TouchableOpacity
                            onPress={refreshRecommendations}
                            style={{
                                padding: spacing.xs,
                                borderRadius: 6,
                                backgroundColor: colors.surface,
                            }}
                        >
                            <FontAwesome name="refresh" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    ) : null
                }
            >
                {isLoadingRecommendations ? (
                    <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                        <LoadingSpinner size="small" />
                        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>
                            Generating recommendations...
                        </Text>
                    </View>
                ) : recommendations && recommendations.recommendations.length > 0 ? (
                    <View style={{ gap: spacing.md }}>
                        {/* Personalized Recommendations (Based on Scans) */}
                        {recommendations.personalized_recommendations && recommendations.personalized_recommendations.length > 0 && (
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
                                    Based on Your Scans
                                </Text>
                                {recommendations.personalized_recommendations.map((rec, index) => (
                                    <View
                                        key={`personalized-${index}`}
                                        style={{
                                            backgroundColor: colors.surface,
                                            borderRadius: 12,
                                            padding: spacing.md,
                                            borderLeftWidth: 3,
                                            borderLeftColor: colors.primary,
                                            gap: spacing.xs,
                                            marginBottom: spacing.sm,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                                            <FontAwesome name="user-md" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                                            <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                                                {rec}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Generic Recommendations */}
                        {recommendations.generic_recommendations && recommendations.generic_recommendations.length > 0 && (
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
                                    General Skin Health Tips
                                </Text>
                                {recommendations.generic_recommendations.map((rec, index) => (
                                    <View
                                        key={`generic-${index}`}
                                        style={{
                                            backgroundColor: colors.surface + '80',
                                            borderRadius: 12,
                                            padding: spacing.md,
                                            borderLeftWidth: 3,
                                            borderLeftColor: colors.textSecondary,
                                            gap: spacing.xs,
                                            marginBottom: spacing.sm,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                                            <FontAwesome name="heart" size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
                                            <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                                                {rec}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Fallback: Show combined recommendations if separated ones aren't available */}
                        {(!recommendations.personalized_recommendations || recommendations.personalized_recommendations.length === 0) &&
                         (!recommendations.generic_recommendations || recommendations.generic_recommendations.length === 0) &&
                         recommendations.recommendations.map((rec, index) => (
                            <View
                                key={`fallback-${index}`}
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: 12,
                                    padding: spacing.md,
                                    borderLeftWidth: 3,
                                    borderLeftColor: colors.primary,
                                    gap: spacing.xs,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                                    <FontAwesome name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                                    <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                                        {rec}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Insights */}
                        {recommendations.insights && recommendations.insights.length > 0 && (
                            <View style={{ marginTop: spacing.sm }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
                                    Insights
                                </Text>
                                {recommendations.insights.map((insight, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            backgroundColor: colors.surface + '80',
                                            borderRadius: 8,
                                            padding: spacing.sm,
                                            marginBottom: spacing.xs,
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                                            {insight}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Action Items */}
                        {recommendations.action_items && recommendations.action_items.length > 0 && (
                            <View style={{ marginTop: spacing.sm }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
                                    Next Steps
                                </Text>
                                {recommendations.action_items.map((action, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            gap: spacing.sm,
                                            paddingVertical: spacing.xs,
                                        }}
                                    >
                                        <FontAwesome name="arrow-right" size={12} color={colors.primary} style={{ marginTop: 4 }} />
                                        <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                                            {action}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <EmptyState
                        icon="lightbulb-o"
                        message="AI-powered recommendations will appear here after your first scan."
                    />
                )}
            </Section>
        </Screen>
    );
}


