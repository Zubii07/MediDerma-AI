import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { Input, LoadingSpinner, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useAncestralData } from '@/features/ancestral/useAncestralData';

const DATA_SOURCE_OPTIONS: { label: string; value: 'user_form' | 'imported' }[] = [
    { label: 'User Form', value: 'user_form' },
    // { label: 'Imported', value: 'imported' },
];

export default function AncestralDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const { colors, spacing } = useTheme();
    const { entries, update, remove, refresh, isLoading } = useAncestralData();

    const entry = useMemo(
        () => entries.find((item) => item.id === params.id),
        [entries, params.id]
    );

    const [formState, setFormState] = useState({
        dataSource: entry?.dataSource ?? 'user_form',
        familyHistory: entry?.userInput.familyHistory?.toUpperCase() ?? '',
        ancestry: entry?.userInput.ancestry?.toUpperCase() ?? '',
        otherFactors: entry?.userInput.otherFactors?.map((item) => item.toUpperCase()).join('\n') ?? '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    useEffect(() => {
        if (entry) {
            setFormState({
                dataSource: entry.dataSource,
                familyHistory: entry.userInput.familyHistory?.toUpperCase() ?? '',
                ancestry: entry.userInput.ancestry?.toUpperCase() ?? '',
                otherFactors: entry.userInput.otherFactors?.map((item) => item.toUpperCase()).join('\n') ?? '',
            });
        }
    }, [entry]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                optionRow: {
                    flexDirection: 'row',
                    gap: spacing.sm,
                    flexWrap: 'wrap',
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
                actionRow: {
                    flexDirection: 'row',
                    gap: spacing.md,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                },
                primaryButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.primary,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 16,
                },
                primaryText: {
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                },
                deleteButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.error,
                },
                deleteText: {
                    color: colors.error,
                    fontSize: 16,
                    fontWeight: '600',
                },
            }),
        [colors, spacing]
    );

    const renderDataSourceOption = (label: string, value: 'user_form' | 'imported') => {
        const isActive = formState.dataSource === value;
        return (
            <TouchableOpacity
                key={value}
                onPress={() => setFormState((prev) => ({ ...prev, dataSource: value }))}
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
                <Text style={{ color: colors.text }}>{label}</Text>
            </TouchableOpacity>
        );
    };

    if (isLoading && !entry) {
        return (
            <Screen>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <LoadingSpinner size="large" />
                </View>
            </Screen>
        );
    }

    if (!entry) {
        return (
            <Screen>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Ancestral Entry',
                        headerTintColor: colors.text,
                        headerStyle: { backgroundColor: colors.background },
                    }}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                    <Text style={{ color: colors.textSecondary }}>Ancestral entry not found.</Text>
                </View>
            </Screen>
        );
    }

    const handleSave = async () => {
        const trimmedFamilyHistory = formState.familyHistory.trim();
        const trimmedAncestry = formState.ancestry.trim();

        if (!trimmedFamilyHistory && !trimmedAncestry) {
            Alert.alert('Incomplete Data', 'Please provide at least family history or ancestry details.');
            return;
        }

        setIsSaving(true);
        try {
            await update(entry.id, {
                dataSource: formState.dataSource,
                userInput: {
                    familyHistory: trimmedFamilyHistory.toUpperCase(),
                    ancestry: trimmedAncestry.toUpperCase(),
                    otherFactors: formState.otherFactors
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => line.toUpperCase()),
                },
            });
            await refresh();
            Alert.alert('Saved', 'Ancestral entry has been updated.');
        } catch (error) {
            Alert.alert('Update Failed', 'Unable to update ancestral data. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Ancestral Entry',
            'This will remove the ancestral record permanently. Do you want to continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await remove(entry.id);
                            await refresh();
                            router.back();
                        } catch (error) {
                            Alert.alert('Deletion Failed', 'Unable to delete ancestral data. Please try again.');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Ancestral Entry',
                    headerTintColor: colors.text,
                    headerStyle: { backgroundColor: colors.background },
                }}
            />

            <View style={{ gap: spacing.md }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                    Edit Ancestral Data
                </Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                    Update family history, ancestry, and other factors. AI-generated insights will update on your profile after processing.
                </Text>
                <View style={styles.optionRow}>
                    {DATA_SOURCE_OPTIONS.map((option) => renderDataSourceOption(option.label, option.value))}
                </View>
            </View>

            <Input
                label="Family History"
                value={formState.familyHistory}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, familyHistory: text.toUpperCase() }))}
                placeholder="Describe family skin health history"
                multiline
                numberOfLines={3}
            />

            <Input
                label="Ancestry"
                value={formState.ancestry}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, ancestry: text.toUpperCase() }))}
                placeholder="e.g. Northern European, South Asian"
            />

            <Input
                label="Other Factors"
                value={formState.otherFactors}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, otherFactors: text.toUpperCase() }))}
                placeholder="Enter other relevant factors (one per line)"
                multiline
                numberOfLines={3}
            />

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.primaryButton, (isSaving || isDeleting) && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={isSaving || isDeleting}
                >
                    <FontAwesome name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.deleteButton, (isSaving || isDeleting) && { opacity: 0.6 }]}
                    onPress={handleDelete}
                    disabled={isSaving || isDeleting}
                >
                    <FontAwesome name="trash" size={16} color={colors.error} />
                    <Text style={styles.deleteText}>{isDeleting ? 'Deleting…' : 'Delete Entry'}</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
}

