import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen, Text, LoadingSpinner, IconButton, Button } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useScans } from '@/features/scans/useScans';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useProfileCompletionGuard } from '@/hooks/useProfileCompletionGuard';

const formatDateTime = (date?: Date) => {
    if (!date) return 'PENDING TIMESTAMP';
    return date.toLocaleString();
};

export default function ScanHistoryScreen() {
    const { colors, spacing } = useTheme();
    const router = useRouter();
    const [itemsPerPage, setItemsPerPage] = useState<number>(5);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPageOptions = useMemo(() => [5, 10, 20], []);
    const { isProfileComplete, missingFields } = useProfileCompletionGuard();
    const { scans, isLoading, deleteScan, totalCount, fetchPage, clearCache, fetchTotalCount } = useScans(
        itemsPerPage,
        { enabled: isProfileComplete }
    );

    useEffect(() => {
        if (isProfileComplete) {
            fetchTotalCount();
        }
    }, [fetchTotalCount, isProfileComplete]);

    useEffect(() => {
        if (isProfileComplete) {
            fetchPage(currentPage, itemsPerPage);
        }
    }, [currentPage, fetchPage, isProfileComplete, itemsPerPage]);

    useEffect(() => {
        if (!isProfileComplete) {
            clearCache();
            setCurrentPage(1);
        }
    }, [clearCache, isProfileComplete]);

    const totalPages = useMemo(() => {
        if (totalCount === 0) {
            return 1;
        }
        return Math.max(1, Math.ceil(totalCount / itemsPerPage));
    }, [itemsPerPage, totalCount]);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);

    const paginatedScans = useMemo(() => scans, [scans]);

    const styles = StyleSheet.create({
        content: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xl,
            gap: spacing.lg,
        },
        headerActions: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        header: {
            gap: spacing.xs,
        },
        title: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            padding: spacing.md,
            gap: spacing.md,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
        },
        cardMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },
        cardMetaText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        statusPill: {
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs / 2,
            borderRadius: 12,
            backgroundColor: colors.primary + '15',
        },
        statusText: {
            fontSize: 12,
            color: colors.primary,
        },
        thumbnail: {
            width: '100%',
            aspectRatio: 1.6,
            borderRadius: 16,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        list: {
            gap: spacing.md,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        actionsRow: {
            flexDirection: 'column',
            gap: spacing.sm,
            marginTop: spacing.md,
        },
        perPageWrapper: {
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: 16,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
        },
        perPageLabelRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.xs,
        },
        perPageLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        perPageOptions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            justifyContent: 'space-between',
        },
        perPageButton: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: spacing.xs,
            borderRadius: 10,
            borderWidth: 1,
        },
        perPageText: {
            fontSize: 12,
            fontWeight: '600',
        },
        paginationControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
        },
        paginationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        paginationButtonDisabled: {
            opacity: 0.4,
        },
        paginationLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
    });

    const handleChangeItemsPerPage = useCallback(
        (value: number) => {
            if (value === itemsPerPage) return;
            clearCache();
            setItemsPerPage(value);
            setCurrentPage(1);
            fetchPage(1, value);
        },
        [clearCache, fetchPage, itemsPerPage]
    );

    const handleDelete = useCallback(
        (scanId: string, imagePath?: string) => {
            Alert.alert(
                'Delete Scan',
                'This will permanently remove the scan and associated image. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            const updatedCount = await deleteScan(scanId, imagePath);
                            if (updatedCount === null) {
                                return;
                            }
                            const nextTotalPages = Math.max(1, Math.ceil(updatedCount / itemsPerPage));
                            const nextPage = Math.min(currentPage, nextTotalPages);
                            clearCache();
                            if (nextPage === currentPage) {
                                fetchPage(nextPage, itemsPerPage);
                            } else {
                                setCurrentPage(nextPage);
                            }
                        },
                    },
                ]
            );
        },
        [clearCache, currentPage, deleteScan, fetchPage, itemsPerPage]
    );

    const renderPaginationControls = () => {
        if (totalCount === 0) return null;

        return (
            <View style={styles.actionsRow}>
                <View style={styles.perPageWrapper}>
                    <View style={styles.perPageLabelRow}>
                        <Text style={styles.perPageLabel}>Items per page</Text>
                        <FontAwesome name="sliders" size={12} color={colors.textSecondary} />
                    </View>
                    <View style={styles.perPageOptions}>
                        {itemsPerPageOptions.map((option) => {
                            const isActive = option === itemsPerPage;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.perPageButton,
                                        {
                                            borderColor: isActive ? colors.primary : colors.border,
                                            backgroundColor: isActive ? colors.primary + '20' : colors.surface,
                                        },
                                    ]}
                                    onPress={() => handleChangeItemsPerPage(option)}
                                >
                                    <Text
                                        style={[
                                            styles.perPageText,
                                            { color: isActive ? colors.primary : colors.textSecondary },
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                <View style={styles.paginationControls}>
                    <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        <FontAwesome name="chevron-left" size={12} color={colors.text} />
                        <Text style={styles.paginationLabel}>Prev</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationLabel}>
                        Page {currentPage} of {totalPages}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.paginationButton,
                            currentPage >= totalPages && styles.paginationButtonDisabled,
                        ]}
                        disabled={currentPage >= totalPages}
                        onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        <Text style={styles.paginationLabel}>Next</Text>
                        <FontAwesome name="chevron-right" size={12} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderHistory = () => {
        if (isLoading) {
            return (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                    <LoadingSpinner size="large" />
                    <Text color="textSecondary">Loading your scan history…</Text>
                </View>
            );
        }

        if (totalCount === 0 || paginatedScans.length === 0) {
            return (
                <EmptyState
                    icon="history"
                    message="No scans captured yet. Upload your first image to build your history."
                />
            );
        }

        return paginatedScans.map((scan) => (
            <TouchableOpacity
                key={scan.id}
                style={styles.card}
                onPress={() => router.push(`/scan-details?scanId=${scan.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                        {scan.predictedDisease && (
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>
                                {scan.predictedDisease}
                            </Text>
                        )}
                        <View style={styles.cardMeta}>
                            <FontAwesome name="calendar" size={14} color={colors.textSecondary} />
                            <Text style={styles.cardMetaText}>
                                Captured: {formatDateTime(scan.capturedAtDate ?? scan.createdAtDate)}
                            </Text>
                        </View>
                        <View style={styles.cardMeta}>
                            <FontAwesome name="clock-o" size={14} color={colors.textSecondary} />
                            <Text style={styles.cardMetaText}>
                                Updated: {formatDateTime(scan.updatedAtDate)}
                            </Text>
                        </View>
                        {scan.confidenceScore && (
                            <View style={styles.cardMeta}>
                                <FontAwesome 
                                    name={scan.isLowConfidence ? "exclamation-circle" : "check-circle"} 
                                    size={14} 
                                    color={scan.isLowConfidence ? colors.warning : colors.primary} 
                                />
                                <Text style={[
                                    styles.cardMetaText, 
                                    { color: scan.isLowConfidence ? colors.warning : colors.primary }
                                ]}>
                                    {Math.round(scan.confidenceScore * 100)}% Confidence
                                    {scan.isLowConfidence && ' (Uncertain)'}
                                </Text>
                            </View>
                        )}
                        {scan.isLowConfidence && (
                            <View style={{
                                marginTop: spacing.xs,
                                padding: spacing.sm,
                                backgroundColor: colors.warning + '15',
                                borderRadius: 8,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.warning,
                            }}>
                                <Text style={{ fontSize: 12, color: colors.text, fontStyle: 'italic' }}>
                                    ⚠️ Image may be unclear. Upload a clearer image for better results.
                                </Text>
                            </View>
                        )}
                    </View>
                    <IconButton
                        icon={<FontAwesome name="trash" size={16} color={colors.error} />}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(scan.id, scan.imagePath);
                        }}
                        size="medium"
                        variant="outlined"
                    />
                </View>
                <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{scan.status?.toUpperCase() ?? 'UNKNOWN'}</Text>
                </View>
                <View style={styles.thumbnail}>
                    {scan.imageUrl ? (
                        <Image
                            source={{ uri: scan.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <FontAwesome name="image" size={28} color={colors.textSecondary} />
                    )}
                </View>
                {scan.symptoms && scan.symptoms.length > 0 && (
                    <View style={{ marginTop: spacing.xs }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                            Symptoms: {scan.symptoms.slice(0, 2).join(', ')}
                            {scan.symptoms.length > 2 && '...'}
                        </Text>
                    </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
                    <FontAwesome name="info-circle" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
                        Tap to view full details
                    </Text>
                </View>
            </TouchableOpacity>
        ));
    };

    if (!isProfileComplete) {
        return (
            <Screen scrollable contentContainerStyle={styles.content}>
                <View style={styles.headerActions}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Scan History</Text>
                        <Text style={styles.subtitle}>Chronological record of your skin scans</Text>
                    </View>
                    <IconButton
                        icon={<FontAwesome name="close" size={18} color={colors.text} />}
                        onPress={() => router.back()}
                        size="medium"
                        variant="outlined"
                    />
                </View>
                <EmptyState
                    icon="lock"
                    message={`Complete your profile (${missingFields.map((field) => field.label).join(', ')}) to unlock scan history.`}
                />
                <Button title="Complete Profile" onPress={() => router.push('/(tabs)/profile/complete-profile')} />
            </Screen>
        );
    }

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <View style={styles.headerActions}>
                <View style={styles.header}>
                    <Text style={styles.title}>Scan History</Text>
                    <Text style={styles.subtitle}>Chronological record of your skin scans</Text>
                </View>
                <IconButton
                    icon={<FontAwesome name="close" size={18} color={colors.text} />}
                    onPress={() => router.back()}
                    size="medium"
                    variant="outlined"
                />
            </View>
            {renderPaginationControls()}
            <View style={styles.list}>{renderHistory()}</View>
            {renderPaginationControls()}
        </Screen>
    );
}

