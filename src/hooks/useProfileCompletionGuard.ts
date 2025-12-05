import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useUserProfile } from './useUserProfile';

export function useProfileCompletionGuard() {
    const { isProfileComplete, missingFields, isLoading, refreshProfile } = useUserProfile();
    const router = useRouter();

    const ensureProfileComplete = useCallback(
        (actionDescription?: string) => {
            if (isLoading) {
                Alert.alert('Please wait', 'We are still loading your profile details. Try again in a moment.');
                return false;
            }

            if (isProfileComplete) {
                return true;
            }

            const missingList = missingFields.map((field) => field.label).join(', ');
            Alert.alert(
                'Complete Your Profile',
                `To ${actionDescription ?? 'use this feature'}, please add: ${missingList}.`,
                [
                    { text: 'Not now', style: 'cancel' },
                    {
                        text: 'Update Profile',
                        onPress: () => router.push('/(tabs)/profile/complete-profile'),
                    },
                ]
            );
            return false;
        },
        [isLoading, isProfileComplete, missingFields, router]
    );

    return {
        isProfileComplete,
        ensureProfileComplete,
        missingFields,
        isProfileLoading: isLoading,
        refreshProfile,
    };
}


