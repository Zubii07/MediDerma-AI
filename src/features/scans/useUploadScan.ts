import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { ImagePickerAsset } from 'expo-image-picker';
import { collection, doc, Timestamp } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { FirebaseFirestoreService } from '@/services/firebase/firestore.firebase';
import { FirebaseStorageService } from '@/services/firebase/storage.firebase';
import { firestore } from '@/firebase/firebase.config';
import { ScanAnalysisResponse } from '@/services/api/api.config';

export interface UploadScanResult {
    scanId: string;
    storagePath: string;
    downloadUrl: string;
    analysis?: ScanAnalysisResponse | null;
}

export function useUploadScan() {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);

    const firestoreService = useMemo(() => new FirebaseFirestoreService(), []);
    const storageService = useMemo(() => new FirebaseStorageService(), []);

    const uploadScan = useCallback(
        async (asset: ImagePickerAsset): Promise<UploadScanResult | null> => {
            if (!user) {
                Alert.alert('Authentication Required', 'Please sign in to upload a scan.');
                return null;
            }

            setIsUploading(true);

            try {
                const compressed = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [],
                    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
                );

                const scanCollectionRef = collection(firestore, 'users', user.uid, 'scans');
                const scanDocumentRef = doc(scanCollectionRef);
                const scanId = scanDocumentRef.id;

                const { downloadUrl, storagePath } = await storageService.uploadScanImage(
                    user.uid,
                    scanId,
                    compressed.uri
                );

                // Analyze image with AI model
                let analysisResult = null;
                try {
                    const { scanAPIService } = await import('@/services/api/scan.api');
                    console.log('[Upload] Starting AI analysis with Gemini...');
                    analysisResult = await scanAPIService.analyzeImageFromUri(compressed.uri);
                    console.log('[Upload] AI analysis completed:', {
                        disease: analysisResult.disease,
                        confidence: analysisResult.confidence,
                        hasDiseaseInfo: !!analysisResult.disease_info,
                        diseaseInfoKeys: analysisResult.disease_info ? Object.keys(analysisResult.disease_info) : [],
                    });
                } catch (error) {
                    console.error('[Upload] AI analysis failed:', error);
                    // Continue with upload even if analysis fails
                }

                // Create scan document with analysis results
                const additionalData = analysisResult
                    ? {
                          predictedDisease: analysisResult.disease,
                          confidenceScore: analysisResult.confidence,
                          isLowConfidence: analysisResult.is_low_confidence,
                          confidenceWarning: analysisResult.confidence_warning,
                          diseaseDescription: analysisResult.disease_info?.description || '',
                          symptoms: analysisResult.disease_info?.symptoms || [],
                          treatmentSuggestion: analysisResult.disease_info?.cure || '',
                          precautions: analysisResult.disease_info?.precautions || [],
                          severity: analysisResult.disease_info?.severity || 'moderate',
                          whenToSeeDoctor: analysisResult.disease_info?.when_to_see_doctor || '',
                          allPredictions: analysisResult.all_predictions || {},
                          alternateDiseases: analysisResult.alternate_diseases
                              ? analysisResult.alternate_diseases.map((alt) => ({
                                    name: alt.name,
                                    probability: alt.probability,
                                    description: alt.disease_info?.description || '',
                                    symptoms: alt.disease_info?.symptoms || [],
                                    treatmentSuggestion: alt.disease_info?.cure || '',
                                    precautions: alt.disease_info?.precautions || [],
                                    severity: alt.disease_info?.severity,
                                    whenToSeeDoctor: alt.disease_info?.when_to_see_doctor || '',
                                }))
                              : undefined,
                          detectedAt: Timestamp.now() as any,
                          modelVersion: analysisResult.model_version || '1.0.0',
                      }
                    : undefined;

                console.log('[Upload] Saving scan with disease info:', {
                    disease: additionalData?.predictedDisease,
                    hasDescription: !!additionalData?.diseaseDescription,
                    hasSymptoms: additionalData?.symptoms?.length > 0,
                    hasTreatment: !!additionalData?.treatmentSuggestion,
                    hasPrecautions: additionalData?.precautions?.length > 0,
                });

                await firestoreService.createScanDocument({
                    userId: user.uid,
                    scanId,
                    imagePath: storagePath,
                    downloadUrl,
                    status: analysisResult ? 'success' : 'pending_analysis',
                    additionalData,
                });

                return { scanId, storagePath, downloadUrl, analysis: analysisResult };
            } catch (error) {
                console.error('Upload scan failed:', error);
                Alert.alert('Upload Failed', 'We could not upload your scan. Please try again.');
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [user, firestoreService, storageService]
    );

    return { uploadScan, isUploading };
}

