import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { FirebaseFirestoreService } from '@/services/firebase/firestore.firebase';
import { DemographicsDocument, UserProfileDocument } from '@/types/firestore';
import { PROFILE_REQUIRED_FIELDS, ProfileRequirement } from '@/constants/profile';

interface UpdateProfileInput {
    gender?: string;
    birthDate?: Date;
}

interface CompletionState {
    completedKeys: string[];
    missingKeys: string[];
    isComplete: boolean;
}

interface UserProfileContextValue {
    profile: UserProfileDocument | null;
    isLoading: boolean;
    isUpdating: boolean;
    isProfileComplete: boolean;
    requiredFields: ProfileRequirement[];
    completedFields: string[];
    missingFields: ProfileRequirement[];
    refreshProfile: () => Promise<void>;
    updateProfile: (input: UpdateProfileInput) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

const getValueAtPath = (obj: unknown, path: string): unknown => {
    if (!obj) return undefined;
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
};

const calculateAge = (birthDate: Date): number => {
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const firestoreService = useMemo(() => new FirebaseFirestoreService(), []);

    const [profile, setProfile] = useState<UserProfileDocument | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [completedFields, setCompletedFields] = useState<string[]>([]);
    const [missingFields, setMissingFields] = useState<ProfileRequirement[]>([]);
    const requiredFields = useMemo(() => PROFILE_REQUIRED_FIELDS, []);

    const computeCompletion = useCallback(
        (data: UserProfileDocument | null): CompletionState => {
            const completedKeys: string[] = [];
            requiredFields.forEach((requirement) => {
                const value = getValueAtPath(data, requirement.key);
                if (value !== undefined && value !== null && value !== '') {
                    completedKeys.push(requirement.key);
                }
            });
            const missingKeys = requiredFields
                .map((requirement) => requirement.key)
                .filter((key) => !completedKeys.includes(key));
            return {
                completedKeys,
                missingKeys,
                isComplete: missingKeys.length === 0,
            };
        },
        [requiredFields]
    );

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setIsProfileComplete(false);
            setCompletedFields([]);
            setMissingFields(requiredFields);
            return;
        }

        setIsLoading(true);
        try {
            let snapshot = await firestoreService.getUserProfile(user.uid);

            if (!snapshot) {
                await firestoreService.updateProfileData(user.uid, {
                    profileCompletion: {
                        requiredFields: requiredFields.map((req) => req.key),
                        completedFields: [],
                        isComplete: false,
                    },
                });
                snapshot = await firestoreService.getUserProfile(user.uid);
            }

            const completion = computeCompletion(snapshot ?? null);

            const storedCompletion = snapshot?.profileCompletion;
            const completionChanged =
                !storedCompletion ||
                storedCompletion.isComplete !== completion.isComplete ||
                storedCompletion.completedFields?.length !== completion.completedKeys.length ||
                storedCompletion.completedFields?.some((key) => !completion.completedKeys.includes(key));

            if (user && completionChanged) {
                await firestoreService.updateProfileData(user.uid, {
                    profileCompletion: {
                        requiredFields: requiredFields.map((req) => req.key),
                        completedFields: completion.completedKeys,
                        isComplete: completion.isComplete,
                        lastUpdated: Timestamp.now(),
                    },
                });
                snapshot = await firestoreService.getUserProfile(user.uid);
            }

            setProfile(snapshot ?? null);
            setIsProfileComplete(completion.isComplete);
            setCompletedFields(completion.completedKeys);
            setMissingFields(
                requiredFields.filter((requirement) => completion.missingKeys.includes(requirement.key))
            );
        } catch (error) {
            console.error('Failed to refresh user profile:', error);
            Alert.alert('Error', 'Unable to load your profile information at the moment.');
        } finally {
            setIsLoading(false);
        }
    }, [computeCompletion, firestoreService, requiredFields, user]);

    const updateProfile = useCallback(
        async ({ gender, birthDate }: UpdateProfileInput) => {
            if (!user) return;
            setIsUpdating(true);

            try {
                const updates: Partial<UserProfileDocument> = {};

                if (gender) {
                    updates.demographics = {
                        ...(profile?.demographics ?? {}),
                        gender,
                    } as DemographicsDocument;
                    updates.profile = {
                        ...(profile?.profile ?? {}),
                        gender,
                    };
                }

                if (birthDate) {
                    const birthTimestamp = Timestamp.fromDate(birthDate);
                    const age = calculateAge(birthDate);
                    updates.demographics = {
                        ...(updates.demographics ?? profile?.demographics ?? {}),
                        birthDate: birthTimestamp,
                        age,
                    };
                    updates.profile = {
                        ...(updates.profile ?? profile?.profile ?? {}),
                        birthYear: birthDate.getFullYear(),
                    };
                }

                await firestoreService.updateProfileData(user.uid, updates);
                await refreshProfile();
            } catch (error) {
                console.error('Failed to update profile:', error);
                Alert.alert('Error', 'Unable to update your profile details. Please try again.');
            } finally {
                setIsUpdating(false);
            }
        },
        [firestoreService, profile, refreshProfile, user]
    );

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    const value = useMemo<UserProfileContextValue>(
        () => ({
            profile,
            isLoading,
            isUpdating,
            isProfileComplete,
            requiredFields,
            completedFields,
            missingFields,
            refreshProfile,
            updateProfile,
        }),
        [
            profile,
            isLoading,
            isUpdating,
            isProfileComplete,
            requiredFields,
            completedFields,
            missingFields,
            refreshProfile,
            updateProfile,
        ]
    );

    return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};

export const useUserProfileContext = (): UserProfileContextValue => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfileContext must be used within a UserProfileProvider');
    }
    return context;
};


