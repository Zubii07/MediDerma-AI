import React, { useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { Button, IconButton, LoadingSpinner, Screen, Text } from '@/components/ui';
import { useTheme, ThemeMode } from '@/theme/index';
import { Section } from '@/components/dashboard/Section';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { InfoRow } from '@/components/dashboard/InfoRow';
import { useAncestralData } from '@/features/ancestral/useAncestralData';
import { useScans } from '@/features/scans/useScans';
import { useProfileCompletionGuard } from '@/hooks/useProfileCompletionGuard';
import { useUserProfile } from '@/hooks/useUserProfile';

const formatUserValue = (value?: string | null) =>
    value ? value.toUpperCase() : '—';

const formatDateTime = (date?: Date) =>
    date ? date.toLocaleString() : 'PENDING TIMESTAMP';

function ActionButton({
    icon,
    label,
    onPress,
    disabled,
    variant = 'solid',
}: {
    icon: keyof typeof FontAwesome.glyphMap;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'solid' | 'outline';
}) {
    const { colors, spacing } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                button: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: spacing.sm,
                    borderRadius: 16,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    backgroundColor: variant === 'solid' ? colors.error : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                    borderColor: variant === 'outline' ? colors.error : 'transparent',
                    width: '100%',
                },
                label: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: variant === 'solid' ? '#FFFFFF' : colors.error,
                },
            }),
        [colors, spacing, variant]
    );

    return (
        <TouchableOpacity
            style={[styles.button, disabled && { opacity: 0.6 }]}
            onPress={onPress}
            disabled={disabled}
        >
            <FontAwesome
                name={icon}
                size={18}
                color={variant === 'solid' ? '#FFFFFF' : colors.error}
            />
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function ProfileTabScreen() {
    const router = useRouter();
    const { colors, spacing, mode, isDark, resolvedMode, setMode } = useTheme();
    const { user, signOut, deleteAccount, isLoading } = useAuth();
    const {
        entries: ancestralEntries,
        isLoading: isLoadingAncestral,
        refresh: refreshAncestral,
    } = useAncestralData();
    const { isProfileComplete, ensureProfileComplete, missingFields, refreshProfile } = useProfileCompletionGuard();
    const {
        latestScan,
        totalCount: totalScanCount,
        isLoading: isLoadingScans,
        fetchPage: fetchScanPage,
        clearCache: clearScanCache,
        fetchTotalCount: refreshScanCount,
    } = useScans(1, { enabled: isProfileComplete });
    const { profile } = useUserProfile();

    const themeOptions = useMemo(
        (): Array<{
            value: ThemeMode;
            label: string;
            description: string;
            icon: keyof typeof FontAwesome.glyphMap;
        }> => [
                {
                    value: 'system',
                    label: 'System Default',
                    description: 'Match the appearance of your device settings.',
                    icon: 'mobile',
                },
                {
                    value: 'light',
                    label: 'Light Mode',
                    description: 'Bright interface suited for well-lit environments.',
                    icon: 'sun-o',
                },
                {
                    value: 'dark',
                    label: 'Dark Mode',
                    description: 'Dim interface that is easier on the eyes at night.',
                    icon: 'moon-o',
                },
            ],
        []
    );

    const handleThemeSelect = useCallback(
        (value: ThemeMode) => {
            if (value === mode) {
                return;
            }
            setMode(value);
        },
        [mode, setMode]
    );

    useFocusEffect(
        useCallback(() => {
            refreshAncestral();
            refreshProfile();
            if (isProfileComplete) {
                refreshScanCount();
                clearScanCache();
                fetchScanPage(1, 1);
            } else {
                clearScanCache();
            }
        }, [
            clearScanCache,
            fetchScanPage,
            isProfileComplete,
            refreshAncestral,
            refreshProfile,
            refreshScanCount,
        ])
    );

    const greetingName = useMemo(() => {
        const base = user?.displayName || user?.email?.split('@')[0] || 'Explorer';
        return formatUserValue(base);
    }, [user?.displayName, user?.email]);

    const genderDisplay = useMemo(
        () => formatUserValue(profile?.demographics?.gender ?? profile?.profile?.gender ?? '—'),
        [profile?.demographics?.gender, profile?.profile?.gender]
    );

    const ageDisplay = useMemo(() => {
        if (profile?.demographics?.age) {
            return String(profile.demographics.age);
        }
        const birthDate = profile?.demographics?.birthDate?.toDate?.();
        if (!birthDate) return '—';
        const now = new Date();
        let age = now.getFullYear() - birthDate.getFullYear();
        const m = now.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? String(age) : '—';
    }, [profile?.demographics?.age, profile?.demographics?.birthDate]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                hero: {
                    alignItems: 'center',
                    gap: spacing.md,
                },
                logo: {
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                },
                heroTitle: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                },
                heroSubtitle: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                },
                accountActions: {
                    gap: spacing.md,
                },
                inlineAction: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                },
                inlineActionText: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.primary,
                },
                sectionActions: {
                    flexDirection: 'row',
                    gap: spacing.lg,
                },
                iconAction: {
                    alignItems: 'center',
                    gap: spacing.xs,
                },
                iconActionLabel: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                },
                buttonsStack: {
                    gap: spacing.md,
                },
                dataCard: {
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
                dataHeader: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                },
                dataTitle: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                },
                dataMeta: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                editButton: {
                    backgroundColor: colors.primary + '15',
                },
                tagRow: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: spacing.xs,
                },
                tag: {
                    paddingVertical: spacing.xs / 2,
                    paddingHorizontal: spacing.sm,
                    backgroundColor: colors.primary + '15',
                    borderRadius: 12,
                },
                tagText: {
                    fontSize: 12,
                    color: colors.primary,
                },
                themeOptionsWrapper: {
                    gap: spacing.sm,
                },
                themeOption: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                },
                themeOptionActive: {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '15',
                },
                themeOptionIcon: {
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary + '12',
                },
                themeOptionIconActive: {
                    backgroundColor: colors.primary,
                },
                themeOptionLabel: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                },
                themeOptionLabelActive: {
                    color: colors.primary,
                },
                themeOptionDescription: {
                    fontSize: 13,
                    color: colors.textSecondary,
                },
            }),
        [colors, spacing]
    );

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Deleting your account will remove all scan history, ancestral data, and preferences. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                        } catch (error) {
                            Alert.alert('Error', 'Unable to delete account right now. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            Alert.alert('Error', 'Unable to sign out right now. Please try again.');
        }
    };

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            {!isProfileComplete && (
                <Section
                    title="Finish setting up your profile"
                    subtitle="Add the missing information below to unlock all features."
                >
                    <View style={{ gap: spacing.sm }}>
                        <Text style={{ color: colors.textSecondary }}>
                            Required: {missingFields.map((field) => field.label).join(', ')}
                        </Text>
                        <Button
                            title="Complete Profile"
                            onPress={() => router.push('/(tabs)/profile/complete-profile')}
                        />
                    </View>
                </Section>
            )}

            <Section
                title={`Hello, ${greetingName}`}
                subtitle="Here is a snapshot of your dermatology profile."
            >
                <View style={styles.hero}>
                    <Image source={require('../../../assets/icon.png')} style={styles.logo} />
                    <Text style={styles.heroTitle}>AI Skin Disease Detector</Text>
                    <Text style={styles.heroSubtitle}>
                        Upload scans, track health history, and receive AI-driven weather alerts tailored to your skin profile.
                    </Text>
                </View>
            </Section>

            <Section
                title="Profile"
                subtitle="Manage your personal information."
                action={
                    <TouchableOpacity
                        style={styles.inlineAction}
                        onPress={() => router.push('/(tabs)/profile/edit-name')}
                    >
                        <FontAwesome name="pencil" size={16} color={colors.primary} />
                        <Text style={styles.inlineActionText}>Edit Name</Text>
                    </TouchableOpacity>
                }
            >
                <InfoRow label="Name" value={user?.displayName ?? '—'} />
                <InfoRow label="Email" value={user?.email ?? '—'} />
                <InfoRow label="Gender" value={genderDisplay} />
                <InfoRow label="Age" value={ageDisplay} />
            </Section>

            <Section
                title="Health History"
                subtitle="Track past scans and AI findings."
                action={
                    isProfileComplete && totalScanCount > 0 ? (
                        <TouchableOpacity
                            style={styles.inlineAction}
                            onPress={() => {
                                if (!ensureProfileComplete('view scan history')) return;
                                router.push('/scan-history');
                            }}
                        >
                            <FontAwesome name="history" size={16} color={colors.primary} />
                            <Text style={styles.inlineActionText}>View All</Text>
                        </TouchableOpacity>
                    ) : undefined
                }
            >
                {isLoadingScans ? (
                    <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                        <LoadingSpinner size="small" />
                        <Text color="textSecondary">Loading your scan history…</Text>
                    </View>
                ) : !isProfileComplete ? (
                    <EmptyState
                        icon="lock"
                        message="Complete your demographic profile to unlock scan features."
                    />
                ) : totalScanCount === 0 || !latestScan ? (
                    <EmptyState
                        icon="stethoscope"
                        message="No scan history yet. Upload a skin image to generate insights."
                    />
                ) : (
                    <View style={styles.dataCard}>
                        <View style={styles.dataHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.dataTitle}>MOST RECENT SCAN</Text>
                                <Text style={styles.dataMeta}>
                                    STATUS: {latestScan.status?.toUpperCase() ?? 'PENDING'}
                                </Text>
                                <Text style={styles.dataMeta}>
                                    CAPTURED: {formatDateTime(latestScan.capturedAtDate ?? latestScan.createdAtDate)}
                                </Text>
                            </View>
                            <IconButton
                                icon={<FontAwesome name="history" size={16} color={colors.primary} />}
                                size="small"
                                style={styles.editButton}
                                onPress={() => {
                                    if (!ensureProfileComplete('view scan history')) return;
                                    router.push('/scan-history');
                                }}
                            />
                        </View>
                        <View style={styles.tagRow}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>TOTAL SCANS: {totalScanCount}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Section>

            <Section
                title="Ancestral Analysis"
                subtitle="Insights derived from your ancestral data."
                action={
                    <View style={styles.sectionActions}>
                        <View style={styles.iconAction}>
                            <IconButton
                                icon={<FontAwesome name="plus" size={18} color="#FFFFFF" />}
                                size="medium"
                                style={{ backgroundColor: colors.primary }}
                                onPress={() => {
                                    if (!ensureProfileComplete('add ancestral data')) return;
                                    router.push('/(tabs)/profile/ancestral-form');
                                }}
                            />
                            <Text style={styles.iconActionLabel}>Add</Text>
                        </View>
                        <View style={styles.iconAction}>
                            <IconButton
                                icon={<FontAwesome name="list" size={18} color={colors.primary} />}
                                size="medium"
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.primary + '40',
                                    backgroundColor: colors.primary + '12',
                                }}
                                onPress={() => {
                                    if (!ensureProfileComplete('view ancestral data')) return;
                                    router.push('/(tabs)/profile/ancestral-list');
                                }}
                            />
                            <Text style={styles.iconActionLabel}>View</Text>
                        </View>
                    </View>
                }
            >
                {isLoadingAncestral ? (
                    <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                        <LoadingSpinner size="small" />
                        <Text color="textSecondary">Loading ancestral data…</Text>
                    </View>
                ) : ancestralEntries.length === 0 ? (
                    <EmptyState
                        icon="users"
                        message="No ancestral data uploaded. Provide family history to unlock deeper insights."
                    />
                ) : (
                    ancestralEntries.map((entry) => (
                        <View key={entry.id} style={styles.dataCard}>
                            <View style={styles.dataHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.dataTitle}>{formatUserValue(entry.userInput.familyHistory)}</Text>
                                    <Text style={styles.dataMeta}>
                                        {entry.dataSource === 'user_form' ? 'Submitted via user form' : 'Imported record'}
                                    </Text>
                                    {entry.userInput.ancestry ? (
                                        <Text style={styles.dataMeta}>Ancestry: {formatUserValue(entry.userInput.ancestry)}</Text>
                                    ) : null}
                                </View>
                                <IconButton
                                    icon={<FontAwesome name="pencil" size={16} color={colors.primary} />}
                                    onPress={() => {
                                        if (!ensureProfileComplete('edit ancestral data')) return;
                                        router.push({ pathname: '/(tabs)/profile/ancestral-detail', params: { id: entry.id } });
                                    }}
                                    size="small"
                                    style={styles.editButton}
                                />
                            </View>
                            {entry.userInput.otherFactors && entry.userInput.otherFactors.length > 0 && (
                                <View style={styles.tagRow}>
                                    {entry.userInput.otherFactors.map((factor, idx) => (
                                        <View key={`${entry.id}-factor-${idx}`} style={styles.tag}>
                                            <Text style={styles.tagText}>{formatUserValue(factor)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))
                )}
            </Section>

            <Section
                title="Appearance"
                subtitle={`Currently using the ${resolvedMode} theme${mode === 'system' ? ' (following system setting)' : ''}.`}
            >
                <View style={styles.themeOptionsWrapper}>
                    {themeOptions.map((option) => {
                        const isActive = mode === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.themeOption,
                                    isActive && styles.themeOptionActive,
                                ]}
                                onPress={() => handleThemeSelect(option.value)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isActive }}
                            >
                                <View
                                    style={[
                                        styles.themeOptionIcon,
                                        isActive && styles.themeOptionIconActive,
                                    ]}
                                >
                                    <FontAwesome
                                        name={option.icon}
                                        size={18}
                                        color={isActive ? '#FFFFFF' : colors.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[
                                            styles.themeOptionLabel,
                                            isActive && styles.themeOptionLabelActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    <Text style={styles.themeOptionDescription}>{option.description}</Text>
                                </View>
                                {isActive && (
                                    <FontAwesome name="check" size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Section>

            <Section title="Account">
                <View style={styles.buttonsStack}>
                    <ActionButton
                        icon="sign-out"
                        label={isLoading ? 'Signing out…' : 'Sign Out'}
                        onPress={handleSignOut}
                        disabled={isLoading}
                    />
                    <ActionButton
                        icon="trash"
                        label="Delete Account"
                        onPress={handleDeleteAccount}
                        disabled={isLoading}
                        variant="outline"
                    />
                </View>
            </Section>
        </Screen>
    );
}

