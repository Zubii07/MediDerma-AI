/**
 * Hook for fetching personalized health recommendations
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScans } from '@/features/scans/useScans';
import { recommendationsAPIService, ScanHistoryItem } from '@/services/api/recommendations.api';
import { RecommendationsResponse } from '@/services/api/recommendations.api';

export function useRecommendations() {
    const { scans, totalCount, isLoading: isLoadingScans, fetchTotalCount, fetchPage, clearCache } = useScans(100, { enabled: true });
    const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scansRef = useRef(scans);
    
    // Keep ref in sync with scans state
    useEffect(() => {
        scansRef.current = scans;
    }, [scans]);

    const fetchRecommendations = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Refresh scans and total count first to ensure we have the latest data
            clearCache();
            const latestTotalCount = await fetchTotalCount();
            
            // Fetch scans and wait for them to load
            await fetchPage(1, 100); // Fetch up to 100 scans for recommendations
            
            // Wait a bit longer for state to update after fetchPage completes
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use the scans from ref (which is kept in sync with state)
            // This ensures we get the latest scans even if state hasn't updated in closure
            const currentScans = scansRef.current;
            
            console.log('[Recommendations] Current scans count:', currentScans.length);
            console.log('[Recommendations] Scans with diseases:', currentScans.filter(s => s.predictedDisease && s.confidenceScore).length);
            
            // If no scans, set default recommendations
            if (!currentScans || currentScans.length === 0) {
                console.log('[Recommendations] No scans found, showing default');
                setRecommendations({
                    success: true,
                    recommendations: [
                        'Start by uploading your first skin scan to get personalized recommendations',
                        'Regular skin monitoring can help detect issues early',
                        'Maintain good skin hygiene and use sunscreen daily',
                    ],
                    insights: [],
                    action_items: [],
                });
                setIsLoading(false);
                return;
            }

            // Prepare scan history for API - filter only scans with disease predictions
            const scanHistory: ScanHistoryItem[] = currentScans
                .filter((scan) => scan.predictedDisease && scan.confidenceScore)
                .map((scan) => {
                    // Handle detectedAt - it could be a Timestamp or Date
                    let detectedAtISO: string;
                    if (scan.detectedAt) {
                        if (typeof scan.detectedAt.toDate === 'function') {
                            // Firestore Timestamp
                            detectedAtISO = scan.detectedAt.toDate().toISOString();
                        } else if (scan.detectedAt instanceof Date) {
                            detectedAtISO = scan.detectedAt.toISOString();
                        } else {
                            detectedAtISO = new Date().toISOString();
                        }
                    } else if (scan.capturedAtDate) {
                        detectedAtISO = scan.capturedAtDate.toISOString();
                    } else {
                        detectedAtISO = new Date().toISOString();
                    }
                    
                    return {
                        disease: scan.predictedDisease!,
                        confidence: scan.confidenceScore!,
                        detected_at: detectedAtISO,
                        severity: scan.severity || null,
                    };
                })
                .slice(0, 20); // Limit to last 20 scans

            console.log('[Recommendations] Prepared scan history:', scanHistory.length, 'scans');
            console.log('[Recommendations] Diseases found:', scanHistory.map(s => `${s.disease} (${(s.confidence * 100).toFixed(0)}%)`));
            console.log('[Recommendations] Sending to Gemini API via backend...');

            if (scanHistory.length === 0) {
                // No scans with disease predictions
                console.log('[Recommendations] No scans with disease predictions');
                setRecommendations({
                    success: true,
                    recommendations: [
                        'Upload scans with disease predictions to get personalized recommendations',
                        'Regular skin monitoring can help detect issues early',
                        'Maintain good skin hygiene and use sunscreen daily',
                    ],
                    insights: [],
                    action_items: [],
                });
                setIsLoading(false);
                return;
            }

            console.log('[Recommendations] Calling API with', scanHistory.length, 'scans and total count', latestTotalCount);
            const result = await recommendationsAPIService.generateRecommendations(
                scanHistory,
                latestTotalCount
            );

            console.log('[Recommendations] Gemini-generated content received from API');
            console.log('[Recommendations] Personalized:', result.personalized_recommendations?.length || 0);
            console.log('[Recommendations] Generic:', result.generic_recommendations?.length || 0);
            console.log('[Recommendations] Insights:', result.insights?.length || 0);
            console.log('[Recommendations] Action items:', result.action_items?.length || 0);
            setRecommendations(result);
        } catch (err: any) {
            console.error('[Recommendations] Error:', err);
            setError(err.message || 'Failed to load recommendations');
            // Set fallback recommendations
            setRecommendations({
                success: true,
                recommendations: [
                    'Continue monitoring your skin regularly with scans',
                    'Maintain good skin hygiene and moisturize daily',
                    'Use sunscreen with SPF 30+ when outdoors',
                ],
                insights: [],
                action_items: [],
            });
        } finally {
            setIsLoading(false);
        }
    }, [scans, fetchTotalCount, fetchPage, clearCache]);

    // Track the last totalCount to detect when scans are added/removed
    const lastTotalCountRef = useRef<number>(0);
    const hasInitializedRef = useRef<boolean>(false);

    useEffect(() => {
        // Only fetch recommendations when:
        // 1. Initial load (hasn't initialized yet) - show default if no scans
        // 2. Total count changes (scan added or removed) - auto-update
        // 3. Not currently loading scans
        const totalCountChanged = lastTotalCountRef.current !== totalCount;
        const isInitialLoad = !hasInitializedRef.current;
        const shouldFetch = !isLoadingScans && (totalCountChanged || isInitialLoad);

        if (shouldFetch) {
            // Update the ref immediately to prevent duplicate calls
            const previousCount = lastTotalCountRef.current;
            lastTotalCountRef.current = totalCount;
            hasInitializedRef.current = true;

            if (totalCount > 0 && (totalCountChanged || isInitialLoad)) {
                // Fetch when count changed (scan added/deleted) or on initial load with scans
                console.log('[Recommendations] TotalCount changed:', previousCount, '->', totalCount);
                // Use fetchRecommendations which will refresh scans and generate recommendations
                fetchRecommendations();
            } else if (totalCount === 0 && isInitialLoad) {
                // Initial load with no scans - set default recommendations
                setRecommendations({
                    success: true,
                    recommendations: [
                        'Start by uploading your first skin scan to get personalized recommendations',
                        'Regular skin monitoring can help detect issues early',
                        'Maintain good skin hygiene and use sunscreen daily',
                    ],
                    insights: [],
                    action_items: [],
                });
            }
        }
    }, [fetchRecommendations, isLoadingScans, totalCount]);

    return {
        recommendations,
        isLoading: isLoading || isLoadingScans,
        error,
        refresh: fetchRecommendations,
    };
}

