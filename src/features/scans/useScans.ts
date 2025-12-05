import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { getDownloadURL, ref } from 'firebase/storage';
import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/firebase/firebase.config';
import { ScanDocument } from '@/types/firestore';
import { FirebaseFirestoreService } from '@/services/firebase/firestore.firebase';
import { FirebaseStorageService } from '@/services/firebase/storage.firebase';

export interface UserScanRecord extends ScanDocument {
    id: string;
    capturedAtDate?: Date;
    createdAtDate?: Date;
    updatedAtDate?: Date;
    isLowConfidence?: boolean;
    confidenceWarning?: string;
    diseaseDescription?: string;
    precautions?: string[];
    severity?: string;
    whenToSeeDoctor?: string;
    allPredictions?: Record<string, number>;
}

const timestampToDate = (value?: Timestamp | null): Date | undefined => {
    if (!value) {
        return undefined;
    }
    try {
        return value.toDate();
    } catch {
        return undefined;
    }
};

type CacheKey = `${number}:${number}`;

interface UseScansOptions {
    enabled?: boolean;
}

export function useScans(initialPageSize = 1, options?: UseScansOptions) {
    const { user } = useAuth();
    const isEnabled = options?.enabled ?? true;

    const [scans, setScans] = useState<UserScanRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const firestoreService = useMemo(() => new FirebaseFirestoreService(), []);
    const storageService = useMemo(() => new FirebaseStorageService(), []);

    const pageCacheRef = useRef<Record<CacheKey, UserScanRecord[]>>({});
    const lastDocCacheRef = useRef<Record<CacheKey, QueryDocumentSnapshot<DocumentData> | null>>({});

    const clearCache = useCallback(() => {
        pageCacheRef.current = {};
        lastDocCacheRef.current = {};
    }, []);

    const resolveImageUrl = useCallback(
        async (record: { id: string; data: ScanDocument }): Promise<UserScanRecord> => {
            const data = record.data;
            let imageUrl = data.imageUrl;

            if (!imageUrl && data.imagePath) {
                try {
                    const storageRefObj = ref(storage, data.imagePath);
                    imageUrl = await getDownloadURL(storageRefObj);
                } catch (error) {
                    console.warn('Unable to resolve scan image URL', record.id, error);
                }
            }

            return {
                ...data,
                imageUrl,
                id: record.id,
                capturedAtDate: timestampToDate(data.capturedAt),
                createdAtDate: timestampToDate(data.createdAt),
                updatedAtDate: timestampToDate(data.updatedAt),
            };
        },
        []
    );

    const fetchTotalCount = useCallback(async (): Promise<number> => {
        if (!user || !isEnabled) {
            setTotalCount(0);
            return 0;
        }

        try {
            const count = await firestoreService.getScanCount(user.uid);
            setTotalCount(count);
            return count;
        } catch (error) {
            console.error('Failed to fetch scan count:', error);
            Alert.alert('Error', 'Unable to fetch scan count right now.');
            return totalCount;
        }
    }, [firestoreService, isEnabled, totalCount, user]);

    const fetchPage = useCallback(
        async (pageNumber: number, pageSize: number) => {
            if (!user || !isEnabled) {
                setScans([]);
                return;
            }

            const cacheKey: CacheKey = `${pageSize}:${pageNumber}`;
            if (pageCacheRef.current[cacheKey]) {
                setScans(pageCacheRef.current[cacheKey]);
                return;
            }

            setIsLoading(true);

            try {
                let cursor: QueryDocumentSnapshot<DocumentData> | null | undefined = undefined;

                if (pageNumber > 1) {
                    for (let p = 1; p < pageNumber; p++) {
                        const key: CacheKey = `${pageSize}:${p}`;

                        if (!pageCacheRef.current[key]) {
                            const { records, lastDoc } = await firestoreService.listScansPage(
                                user.uid,
                                pageSize,
                                cursor ?? undefined
                            );
                            const hydratedRecords = await Promise.all(records.map(resolveImageUrl));
                            pageCacheRef.current[key] = hydratedRecords;
                            lastDocCacheRef.current[key] = lastDoc ?? null;
                            cursor = lastDoc ?? null;
                            if (!cursor) {
                                break;
                            }
                        } else {
                            cursor = lastDocCacheRef.current[key] ?? null;
                            if (!cursor) {
                                break;
                            }
                        }
                    }

                    if (cursor === null) {
                        setScans([]);
                        setIsLoading(false);
                        return;
                    }
                }

                const { records, lastDoc } = await firestoreService.listScansPage(
                    user.uid,
                    pageSize,
                    pageNumber > 1 ? cursor ?? undefined : undefined
                );
                const hydratedRecords = await Promise.all(records.map(resolveImageUrl));

                pageCacheRef.current[cacheKey] = hydratedRecords;
                lastDocCacheRef.current[cacheKey] = lastDoc ?? null;
                setScans(hydratedRecords);
            } catch (error) {
                console.error('Failed to fetch scans:', error);
                Alert.alert('Error', 'Unable to load scan history. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        [firestoreService, isEnabled, resolveImageUrl, user]
    );

    const deleteScan = useCallback(
        async (scanId: string, imagePath: string | undefined): Promise<number | null> => {
            if (!user) return null;
            setIsMutating(true);
            try {
                if (imagePath) {
                    await storageService.deleteScanImage(imagePath);
                }
                await firestoreService.deleteScanDocument(user.uid, scanId);
                
                // Remove deleted scan from local state immediately
                setScans((prevScans) => prevScans.filter((scan) => scan.id !== scanId));
                
                clearCache();
                const updatedCount = await fetchTotalCount();
                
                // Always refetch page 1 to ensure latest scan is updated
                // This is important for the home screen which shows the latest scan
                await fetchPage(1, initialPageSize);
                
                return updatedCount;
            } catch (error) {
                console.error('Failed to delete scan:', error);
                Alert.alert('Error', 'Unable to delete this scan right now. Please try again.');
                return null;
            } finally {
                setIsMutating(false);
            }
        },
        [clearCache, fetchTotalCount, fetchPage, firestoreService, storageService, user, scans]
    );

    useEffect(() => {
        clearCache();
        setScans([]);
        if (isEnabled && user) {
            fetchTotalCount();
            fetchPage(1, initialPageSize);
        } else {
            setTotalCount(0);
        }
    }, [clearCache, fetchPage, fetchTotalCount, initialPageSize, isEnabled, user]);

    const latestScan = scans.length > 0 ? scans[0] : undefined;

    // Refresh function to force refetch of current page
    const refresh = useCallback(async () => {
        if (user && isEnabled) {
            clearCache();
            setScans([]);
            await fetchTotalCount();
            await fetchPage(1, initialPageSize);
        }
    }, [clearCache, fetchPage, fetchTotalCount, initialPageSize, isEnabled, user]);

    return {
        scans,
        latestScan,
        totalCount,
        isLoading: isLoading || isMutating,
        fetchPage,
        deleteScan,
        clearCache,
        fetchTotalCount,
        refresh,
    };
}

