import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { Screen, Input, Text, Button } from '@/components/ui';
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

export default function EditNameScreen() {
    const router = useRouter();
    const { colors, spacing } = useTheme();
    const { user, updateDisplayName, isLoading } = useAuth();
    const { profile, updateProfile, isUpdating } = useUserProfile();

    const existingGender = profile?.demographics?.gender ?? profile?.profile?.gender ?? '';
    const existingBirthDate = profile?.demographics?.birthDate?.toDate?.() ?? null;

    const [name, setName] = useState((user?.displayName ?? '').toUpperCase());
    const [gender, setGender] = useState<string>(existingGender);
    const [birthDate, setBirthDate] = useState<Date | null>(existingBirthDate);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formattedBirthDate = useMemo(() => formatDateString(birthDate), [birthDate]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.xl,
                    gap: spacing.lg,
                },
                description: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20,
                },
                actionsRow: {
                    flexDirection: 'row',
                    gap: spacing.md,
                },
                primaryButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                },
                primaryText: {
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '600',
                },
                secondaryButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                secondaryText: {
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
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
                section: {
                    gap: spacing.md,
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
                datePickerButtonContainer: {
                    marginTop: spacing.sm,
                },
            }),
        [colors, spacing]
    );

    const showDatePicker = useCallback(() => {
        setIsDatePickerVisible(true);
    }, []);

    const handleDatePickerDismiss = useCallback(() => {
        setIsDatePickerVisible(false);
    }, []);

    const handleDateChange = useCallback((_: unknown, selectedDate?: Date) => {
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
    }, []);

    const handleSave = useCallback(async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            Alert.alert('Invalid Name', 'Please enter a valid name before saving.');
            return;
        }
        if (!gender) {
            Alert.alert('Missing Gender', 'Please select a gender before saving.');
            return;
        }
        if (!birthDate) {
            Alert.alert('Missing Date of Birth', 'Please select a valid date of birth.');
            return;
        }
        const now = new Date();
        if (birthDate > now) {
            Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
            return;
        }

        const uppercaseName = trimmed.toUpperCase();
        const nameChanged = uppercaseName !== (user?.displayName ?? '').toUpperCase();
        const genderChanged = gender !== existingGender;
        const birthChanged = birthDate.getTime() !== (existingBirthDate?.getTime() ?? -1);

        if (!nameChanged && !genderChanged && !birthChanged) {
            Alert.alert('No Changes', 'Update your name, gender, or date of birth, then try again.');
            return;
        }

        setIsSaving(true);
        try {
            if (nameChanged) {
                await updateDisplayName(uppercaseName);
            }
            if (genderChanged || birthChanged) {
                await updateProfile({
                    gender,
                    birthDate,
                });
            }
            Alert.alert('Profile Updated', 'Your profile details have been updated.', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Update Failed', 'We were unable to update your profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [
        birthDate,
        existingBirthDate,
        existingGender,
        gender,
        name,
        router,
        updateDisplayName,
        updateProfile,
        user?.displayName,
    ]);

    return (
        <Screen scrollable contentContainerStyle={styles.content}>
            <View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
                    Update Profile Details
                </Text>
                <Text style={styles.description}>
                    Update your display name and demographic info so insights stay relevant across the app.
                </Text>
            </View>

            <View style={styles.card}>
                <View style={styles.section}>
                    <Input
                        label="Display Name"
                        value={name}
                        onChangeText={(text) => setName(text.toUpperCase())}
                        placeholder="Enter your name"
                        autoCapitalize="words"
                        editable={!isSaving && !isLoading && !isUpdating}
                        helperText="Use your preferred name. You can update this anytime."
                    />
                </View>

                <View style={styles.section}>
                    <Text style={{ color: colors.textSecondary }}>Select your gender identity</Text>
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
                                    disabled={isSaving || isUpdating}
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

                <View style={[styles.section]}>
                    <Text style={{ color: colors.textSecondary }}>Enter your date of birth</Text>
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
                            disabled={isSaving || isUpdating}
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
                                <Button title="Done" onPress={handleDatePickerDismiss} variant="secondary" />
                            )}
                        </>
                    )}
                </View>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.secondaryButton, (isSaving || isLoading || isUpdating) && { opacity: 0.6 }]}
                    onPress={() => router.back()}
                    disabled={isSaving || isLoading || isUpdating}
                >
                    <FontAwesome name="arrow-left" size={16} color={colors.textSecondary} />
                    <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, (isSaving || isLoading || isUpdating) && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={isSaving || isLoading || isUpdating}
                >
                    <FontAwesome name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryText}>
                        {isSaving || isUpdating ? 'Saving…' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
}

