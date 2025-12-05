import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

import { Screen, Text, Input, Button } from '@/components/ui';
import { useTheme } from '@/theme/index';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PROFILE_GENDER_OPTIONS } from '@/constants/profile';

const formatDateString = (date?: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date | null => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map((part) => parseInt(part, 10));
    if (!year || !month || !day) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

export default function CompleteProfileScreen() {
    const { colors, spacing } = useTheme();
    const router = useRouter();
    const {
        profile,
        updateProfile,
        isUpdating,
        missingFields,
        requiredFields,
        isProfileComplete,
    } = useUserProfile();

    const existingGender = profile?.demographics?.gender ?? profile?.profile?.gender ?? '';
    const existingBirthDate = profile?.demographics?.birthDate?.toDate?.() ?? null;

    const [gender, setGender] = useState<string>(existingGender);
    const [birthDate, setBirthDate] = useState<Date | null>(existingBirthDate);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

    const formattedBirthDate = useMemo(() => formatDateString(birthDate), [birthDate]);

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
                card: {
                    padding: spacing.lg,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    gap: spacing.md,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 2,
                },
                genderRow: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: spacing.sm,
                },
                genderOption: {
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                },
                genderText: {
                    fontSize: 14,
                    fontWeight: '600',
                },
                helperText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
                buttonsRow: {
                    flexDirection: 'row',
                    gap: spacing.md,
                },
                datePickerContainer: {
                    gap: spacing.xs,
                },
                datePickerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                datePickerButtonContainer: {
                    marginTop: spacing.sm,
                },
                headline: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text,
                },
                bodyText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20,
                },
                requiredList: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: spacing.xs,
                },
                requirementBadge: {
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs / 2,
                    backgroundColor: colors.primary + '15',
                    borderRadius: 12,
                },
                requirementText: {
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: '600',
                },
            }),
        [colors, spacing]
    );

    const handleSave = useCallback(async () => {
        const missing: string[] = [];
        if (!gender) {
            missing.push('gender');
        }
        if (!birthDate) {
            missing.push('date of birth');
        }

        if (missing.length > 0) {
            Alert.alert('Incomplete Details', `Please provide your ${missing.join(' and ')}.`);
            return;
        }

        if (birthDate) {
            const now = new Date();
            if (birthDate > now) {
                Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
                return;
            }
        }

        try {
            await updateProfile({
                gender,
                birthDate: birthDate ?? undefined,
            });
            Alert.alert('Profile Updated', 'Thank you! Your demographic details are saved.', [
                {
                    text: 'Continue',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    }, [birthDate, gender, router, updateProfile]);

    const showDatePicker = useCallback(() => {
        setIsDatePickerVisible(true);
    }, []);

    const handleDateChange = useCallback(
        (_event: unknown, selectedDate?: Date) => {
            if (!selectedDate) {
                if (Platform.OS !== 'ios') {
                    setIsDatePickerVisible(false);
                }
                return;
            }
            setBirthDate(selectedDate);
            if (Platform.OS !== 'ios') {
                setIsDatePickerVisible(false);
            }
        },
        []
    );

    const handleDatePickerDismiss = useCallback(() => {
        setIsDatePickerVisible(false);
    }, []);

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.headline}>Complete Your Profile</Text>
                <Text style={styles.bodyText}>
                    We ask for basic demographics so we can personalise risk insights and guidelines for you. This helps
                    the AI produce accurate results.
                </Text>
                <View style={styles.requiredList}>
                    {requiredFields.map((requirement) => (
                        <View key={requirement.key} style={styles.requirementBadge}>
                            <Text style={styles.requirementText}>{requirement.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {!isProfileComplete && (
                <View style={styles.card}>
                    <Text style={styles.bodyText}>
                        Remaining: {missingFields.length > 0 ? missingFields.map((field) => field.label).join(', ') : 'All done!'}
                    </Text>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.bodyText}>Select your gender identity</Text>
                    <View style={styles.genderRow}>
                        {PROFILE_GENDER_OPTIONS.map((option) => {
                            const isActive = gender === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderOption,
                                        {
                                            borderColor: isActive ? colors.primary : colors.border,
                                            backgroundColor: isActive ? colors.primary + '15' : colors.surface,
                                        },
                                    ]}
                                    onPress={() => setGender(option)}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            { color: isActive ? colors.primary : colors.textSecondary },
                                        ]}
                                    >
                                        {option.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.section, styles.datePickerContainer]}>
                    <Text style={styles.bodyText}>Enter your date of birth</Text>
                    <Input
                        label="Date of Birth"
                        placeholder="YYYY-MM-DD"
                        value={formattedBirthDate}
                        editable={false}
                        pointerEvents="none"
                    />
                    <View style={styles.datePickerButtonContainer}>
                        <Button
                            title={formattedBirthDate ? 'Change Date' : 'Select Date'}
                            onPress={showDatePicker}
                            variant="secondary"
                        />
                    </View>
                    {isDatePickerVisible && (
                        <>
                            <DateTimePicker
                                value={birthDate ?? new Date(1990, 0, 1)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={handleDateChange}
                            />
                            {Platform.OS === 'ios' && (
                                <Button
                                    title="Done"
                                    onPress={handleDatePickerDismiss}
                                    variant="secondary"
                                />
                            )}
                        </>
                    )}
                </View>

                <View style={styles.buttonsRow}>
                    <Button title="Save Profile" onPress={handleSave} loading={isUpdating} />
                    <Button title="Cancel" onPress={() => router.back()} variant="secondary" disabled={isUpdating} />
                </View>
            </View>
        </Screen>
    );
}


