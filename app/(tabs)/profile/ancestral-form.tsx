import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { Input, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useAncestralData } from '@/features/ancestral/useAncestralData';

const DATA_SOURCE_OPTIONS = [
    { label: 'User Form', value: 'user_form' },
    { label: 'Imported', value: 'imported' },
];

export default function AncestralFormScreen() {
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const { create } = useAncestralData();

    const [dataSource, setDataSource] = useState<'user_form' | 'imported'>('user_form');
    const [familyHistory, setFamilyHistory] = useState('');
    const [ancestry, setAncestry] = useState('');
    const [otherFactors, setOtherFactors] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                section: {
                    gap: spacing.md,
                },
                label: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.textSecondary,
                },
                optionRow: {
                    flexDirection: 'row',
                    gap: spacing.sm,
                },
                optionButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: 12,
                    borderWidth: 1,
                },
                primaryButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                },
                primaryText: {
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                },
                secondaryButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                secondaryText: {
                    color: colors.textSecondary,
                    fontSize: 16,
                    fontWeight: '600',
                },
            }),
        [colors, spacing]
    );

    const parseMultilineInput = (value: string): string[] =>
        value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.toUpperCase());

    const handleSubmit = async () => {
        const trimmedFamilyHistory = familyHistory.trim();
        const trimmedAncestry = ancestry.trim();

        if (!trimmedFamilyHistory && !trimmedAncestry) {
            Alert.alert('Incomplete Data', 'Please provide at least family history or ancestry details.');
            return;
        }

        setIsSubmitting(true);
        try {
            await create({
                dataSource,
                userInput: {
                    familyHistory: trimmedFamilyHistory.toUpperCase(),
                    ancestry: trimmedAncestry.toUpperCase(),
                    otherFactors: parseMultilineInput(otherFactors),
                },
                skinHealthInsights: [],
                recommendations: [],
                modelVersion: 'PENDING',
            });

            Alert.alert('Submitted', 'Your ancestral data has been saved.', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Unable to save ancestral data. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Ancestral Data',
                    headerTintColor: colors.text,
                    headerStyle: { backgroundColor: colors.background },
                }}
            />

            <View style={styles.section}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                    Ancestral Skin Health Profile
                </Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                    Provide family history and ancestry information to help the AI model tailor insights specific to your background.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Data Source</Text>
                <View style={styles.optionRow}>
                    {DATA_SOURCE_OPTIONS.map((option) => {
                        const isActive = option.value === dataSource;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setDataSource(option.value as typeof dataSource)}
                                style={[
                                    styles.optionButton,
                                    {
                                        borderColor: isActive ? colors.primary : colors.border,
                                        backgroundColor: isActive ? colors.primary + '15' : colors.surface,
                                    },
                                ]}
                            >
                                <FontAwesome
                                    name={isActive ? 'dot-circle-o' : 'circle-o'}
                                    size={16}
                                    color={isActive ? colors.primary : colors.textSecondary}
                                />
                                <Text style={{ color: colors.text }}>{option.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <Input
                label="Family History"
                value={familyHistory}
                onChangeText={(text) => setFamilyHistory(text.toUpperCase())}
                placeholder="Describe any known skin conditions in your family"
                multiline
                numberOfLines={3}
            />
            <Input
                label="Ancestry"
                value={ancestry}
                onChangeText={(text) => setAncestry(text.toUpperCase())}
                placeholder="e.g., Northern European, South Asian"
            />
            <Input
                label="Other Factors"
                value={otherFactors}
                onChangeText={(text) => setOtherFactors(text.toUpperCase())}
                placeholder="List other relevant factors (one per line)"
                multiline
                numberOfLines={3}
            />

            <View style={styles.section}>
                <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                    After submission, our AI will analyze the data and enrich it with more precise insights tailored to your ancestry.
                </Text>
            </View>

            <View style={[styles.section, styles.optionRow]}>
                <TouchableOpacity
                    style={[styles.secondaryButton, (isSubmitting) && { opacity: 0.6 }]}
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                >
                    <FontAwesome name="arrow-left" size={16} color={colors.textSecondary} />
                    <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, (isSubmitting) && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <FontAwesome name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryText}>{isSubmitting ? 'Submitting…' : 'Submit Data'}</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
}

