import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { FirebaseAncestralDataService } from '@/services/firebase/ancestral.firebase';
import { AncestralDataDocument } from '@/types/firestore';

export interface AncestralDataEntry extends AncestralDataDocument {
    id: string;
}

export function useAncestralData() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<AncestralDataEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const service = useMemo(() => new FirebaseAncestralDataService(), []);

    const refresh = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await service.listAncestralData(user.uid);
            setEntries(data.map(({ id, data }) => ({ id, ...data })));
        } catch (error) {
            console.error('Failed to load ancestral data:', error);
            Alert.alert('Error', 'Unable to load ancestral data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [service, user]);

    const create = useCallback(
        async (payload: Omit<AncestralDataDocument, 'uploadedAt'>) => {
            if (!user) return;
            setIsLoading(true);
            try {
                const normalized: Omit<AncestralDataDocument, 'uploadedAt'> = {
                    ...payload,
                    userInput: {
                        familyHistory: payload.userInput.familyHistory?.toUpperCase() ?? '',
                        ancestry: payload.userInput.ancestry?.toUpperCase() ?? '',
                        otherFactors: payload.userInput.otherFactors
                            ? payload.userInput.otherFactors.map((item) => item.toUpperCase())
                            : [],
                    },
                    skinHealthInsights: payload.skinHealthInsights?.map((item) => item.toUpperCase()) ?? [],
                    recommendations: payload.recommendations?.map((item) => item.toUpperCase()) ?? [],
                    modelVersion: payload.modelVersion,
                };
                const id = await service.createAncestralData({
                    userId: user.uid,
                    data: normalized,
                });
                setEntries((prev) => [{ id, ...normalized, uploadedAt: new Date() as any }, ...prev]);
                return id;
            } catch (error) {
                console.error('Failed to create ancestral data:', error);
                Alert.alert('Error', 'Unable to save ancestral data. Please try again.');
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [service, user]
    );

    const update = useCallback(
        async (analysisId: string, data: Partial<AncestralDataDocument>) => {
            if (!user) return;
            setIsLoading(true);
            try {
                const normalized: Partial<AncestralDataDocument> = { ...data };
                if (data.userInput) {
                    normalized.userInput = {
                        familyHistory: data.userInput.familyHistory?.toUpperCase() ?? '',
                        ancestry: data.userInput.ancestry?.toUpperCase() ?? '',
                        otherFactors: data.userInput.otherFactors
                            ? data.userInput.otherFactors.map((item) => item.toUpperCase())
                            : [],
                    };
                }
                await service.updateAncestralData({
                    userId: user.uid,
                    analysisId,
                    data: normalized,
                });
                setEntries((prev) =>
                    prev.map((entry) => {
                        if (entry.id !== analysisId) {
                            return entry;
                        }

                        return {
                            ...entry,
                            ...normalized,
                            skinHealthInsights: normalized.skinHealthInsights ?? entry.skinHealthInsights,
                            recommendations: normalized.recommendations ?? entry.recommendations,
                            modelVersion: normalized.modelVersion ?? entry.modelVersion,
                            userInput: normalized.userInput
                                ? {
                                    ...entry.userInput,
                                    ...normalized.userInput,
                                    otherFactors: normalized.userInput.otherFactors ?? entry.userInput.otherFactors,
                                }
                                : entry.userInput,
                        };
                    })
                );
            } catch (error) {
                console.error('Failed to update ancestral data:', error);
                Alert.alert('Error', 'Unable to update ancestral data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        [service, user]
    );

    const remove = useCallback(
        async (analysisId: string) => {
            if (!user) return;
            setIsLoading(true);
            try {
                await service.deleteAncestralData(user.uid, analysisId);
                setEntries((prev) => prev.filter((entry) => entry.id !== analysisId));
            } catch (error) {
                console.error('Failed to delete ancestral data:', error);
                Alert.alert('Error', 'Unable to delete ancestral data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        [service, user]
    );

    return {
        entries,
        isLoading,
        refresh,
        create,
        update,
        remove,
    };
}

