import { GeoPoint, Timestamp } from 'firebase/firestore';

export type ScanStatus = 'pending_analysis' | 'processing' | 'success' | 'failed';

export interface UserPreferences {
    notifications: boolean;
    language: string;
    theme?: 'light' | 'dark' | 'system';
}

export interface UserProfileDocument {
    name: string | null;
    email: string;
    createdAt: Timestamp;
    lastLogin: Timestamp;
    preferences: UserPreferences;
    profile?: {
        photoUrl?: string;
        gender?: string;
        birthYear?: number;
    };
    healthSummary?: {
        totalScans: number;
        lastScanAt?: Timestamp;
        prevalentCondition?: string;
    };
    demographics?: DemographicsDocument;
    profileCompletion?: ProfileCompletionDocument;
}

export interface AlternateDiseaseEntry {
    name: string;
    probability: number;
    description: string;
    symptoms: string[];
    treatmentSuggestion: string;
    precautions: string[];
    severity?: string;
    whenToSeeDoctor?: string;
}

export interface ScanDocument {
    capturedAt: Timestamp;
    status: ScanStatus;
    imagePath: string;
    imageUrl?: string;
    thumbnailPath?: string;
    predictedDisease?: string;
    treatmentSuggestion?: string; // Cure/treatment
    diseaseDescription?: string; // Full description
    symptoms?: string[];
    precautions?: string[];
    severity?: string;
    whenToSeeDoctor?: string;
    allPredictions?: Record<string, number>; // All disease predictions with probabilities
    confidenceScore?: number;
    isLowConfidence?: boolean;
    confidenceWarning?: string;
    alternateDiseases?: AlternateDiseaseEntry[];
    modelVersion?: string;
    detectedAt?: Timestamp;
    error?: {
        code: string;
        message: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface HealthHistoryEntry {
    scanId: string;
    predictedDisease: string;
    detectedAt: Timestamp;
    treatmentSuggestion: string;
    clinicianNotes?: string;
    followUp?: {
        status: 'pending' | 'scheduled' | 'completed';
        appointmentAt?: Timestamp;
    };
}

export interface AncestralDataDocument {
    uploadedAt: Timestamp;
    dataSource: 'user_form' | 'imported';
    userInput: {
        familyHistory: string;
        ancestry: string;
        otherFactors?: string[];
    };
    skinHealthInsights: string[];
    recommendations: string[];
    modelVersion?: string;
}

export interface WeatherAlertDocument {
    generatedAt: Timestamp;
    location: {
        coordinates?: GeoPoint;
        city?: string;
        country?: string;
    };
    weather: {
        temperatureC: number;
        humidity: number;
        uvIndex: number;
        conditions: string;
    };
    riskAssessment: {
        uvRisk: 'low' | 'moderate' | 'high';
        humidityImpact: string;
        triggers: string[];
    };
    personalizedTips: string[];
}

export interface ProfileCompletionDocument {
    requiredFields: string[];
    completedFields: string[];
    isComplete: boolean;
    lastUpdated?: Timestamp;
}

export interface DemographicsDocument {
    gender?: string;
    birthDate?: Timestamp;
    age?: number;
}


