/**
 * API Configuration for FastAPI Backend
 */
import { config } from '@/environment/environment';

// Get API URL from environment or use default
// For Android emulator: use http://10.0.2.2:8000
// For physical device: use your computer's IP (e.g., http://192.168.1.69:8000)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Log API URL for debugging
if (__DEV__) {
    console.log('API Base URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
    BASE_URL: API_BASE_URL,
    SCAN: {
        ANALYZE: `/api/scan/analyze`,
        ANALYZE_BASE64: `/api/scan/analyze-base64`,
    },
    WEATHER: {
        PREDICT: `/api/weather/predict`,
    },
    HEALTH: {
        CHECK: `/api/health`,
        READY: `/api/ready`,
    },
    RECOMMENDATIONS: {
        GENERATE: `/api/recommendations/generate`,
    },
} as const;

export interface DiseaseInfo {
    name: string;
    description: string;
    symptoms: string[];
    cure: string;
    precautions: string[];
    severity: string;
    when_to_see_doctor: string;
}

export interface ScanAnalysisResponse {
    success: boolean;
    disease: string;
    confidence: number;
    is_low_confidence?: boolean;
    confidence_warning?: string | null;
    disease_info: DiseaseInfo;
    all_predictions: Record<string, number>;
    alternate_diseases?: Array<{
        name: string;
        probability: number;
        disease_info: DiseaseInfo;
    }>;
    model_version: string;
}

export interface WeatherPredictionRequest {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
}

export interface WeatherPredictionResponse {
    location: {
        latitude: number;
        longitude: number;
        city?: string;
        country?: string;
    };
    weather: {
        temperature: number;
        humidity: number;
        conditions: string;
        feels_like?: number;
    };
    risk_assessment: {
        overall_risk: string;
        uv_risk: string;
        humidity_impact: string;
    };
    potential_diseases: Array<{
        name: string;
        risk: string;
        reason: string;
    }>;
    recommendations: string[];
    precautions: string[];
}


