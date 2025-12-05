import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { Screen, LoadingSpinner, Text, IconButton, Button } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useAncestralData } from '@/features/ancestral/useAncestralData';
import { useProfileCompletionGuard } from '@/hooks/useProfileCompletionGuard';

const toUpper = (value?: string | null) => (value ? value.toUpperCase() : '—');
const toUpperArray = (values?: string[] | null) =>
    values ? values.map((item) => item.toUpperCase()) : [];

export default function AncestralListScreen() {
    const { colors, spacing } = useTheme();
    const router = useRouter();
    const {
        entries,
        isLoading,
        refresh,
    } = useAncestralData();
    const { isProfileComplete, ensureProfileComplete, missingFields } = useProfileCompletionGuard();

    useFocusEffect(
        useCallback(() => {
            if (isProfileComplete) {
                refresh();
            }
        }, [isProfileComplete, refresh])
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                pageHeader: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                },
                pageTitle: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                },
                pageSubtitle: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                },
                addButton: {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                },
                card: {
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    padding: spacing.md,
                    gap: spacing.sm,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                },
                header: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                },
                title: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                },
                meta: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                tagRow: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: spacing.xs,
                },
                tag: {
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs / 2,
                    borderRadius: 12,
                    backgroundColor: colors.primary + '15',
                },
                tagText: {
                    fontSize: 12,
                    color: colors.primary,
                },
            }),
        [colors, spacing]
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                    <LoadingSpinner size="large" />
                    <Text color="textSecondary">Loading ancestral entries…</Text>
                </View>
            );
        }

        if (entries.length === 0) {
            return (
                <Text color="textSecondary">No ancestral data added yet. Capture family history to begin.</Text>
            );
        }

        return entries.map((entry) => (
            <View key={entry.id} style={styles.card}>
                <View style={styles.header}>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={styles.title}>{toUpper(entry.userInput.familyHistory)}</Text>
                        <Text style={styles.meta}>
                            {entry.dataSource === 'user_form' ? 'Submitted via user form' : 'Imported record'}
                        </Text>
                        {entry.userInput.ancestry ? (
                            <Text style={styles.meta}>Ancestry: {toUpper(entry.userInput.ancestry)}</Text>
                        ) : null}
                    </View>
                    <IconButton
                        icon={<FontAwesome name="pencil" size={16} color={colors.primary} />}
                        onPress={() => {
                            if (!ensureProfileComplete('edit ancestral data')) return;
                            router.push({ pathname: '/(tabs)/profile/ancestral-detail', params: { id: entry.id } });
                        }}
                        size="small"
                    />
                </View>
                {entry.userInput.otherFactors && entry.userInput.otherFactors.length > 0 && (
                    <View style={styles.tagRow}>
                        {toUpperArray(entry.userInput.otherFactors).map((factor, idx) => (
                            <View key={`${entry.id}-factor-${idx}`} style={styles.tag}>
                                <Text style={styles.tagText}>{factor}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        ));
    };

    if (!isProfileComplete) {
        return (
            <Screen scrollable contentContainerStyle={styles.content}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Ancestral Data</Text>
                <Text style={{ color: colors.textSecondary }}>
                    Complete your profile ({missingFields.map((field) => field.label).join(', ')}) to manage ancestral data.
                </Text>
                <Button title="Complete Profile" onPress={() => router.push('/(tabs)/profile/complete-profile')} />
            </Screen>
        );
    }

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View style={styles.pageHeader}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text style={styles.pageTitle}>Ancestral Data</Text>
                    <Text style={styles.pageSubtitle}>
                        Review all uploaded family history, ancestry, and contributing factors.
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        if (!ensureProfileComplete('add ancestral data')) return;
                        router.push('/(tabs)/profile/ancestral-form');
                    }}
                >
                    <FontAwesome name="plus" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {renderContent()}
        </Screen>
    );
}

