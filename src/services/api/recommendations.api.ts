/**
 * Recommendations API Service
 * Generates personalized health recommendations based on user's scan history
 */
import axios, { AxiosInstance } from 'axios';
import { API_ENDPOINTS } from './api.config';

export interface ScanHistoryItem {
    disease: string;
    confidence: number;
    detected_at: string;
    severity?: string | null;
}

export interface RecommendationsRequest {
    scan_history: ScanHistoryItem[];
    total_scans: number;
}

export interface RecommendationsResponse {
    success: boolean;
    recommendations: string[]; // Combined list (personalized + generic)
    personalized_recommendations?: string[]; // Based on scan history
    generic_recommendations?: string[]; // General health tips
    insights: string[];
    action_items: string[];
}

class RecommendationsAPIService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_ENDPOINTS.BASE_URL,
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Generate personalized recommendations based on scan history
     */
    async generateRecommendations(
        scanHistory: ScanHistoryItem[],
        totalScans: number
    ): Promise<RecommendationsResponse> {
        try {
            const response = await this.client.post<RecommendationsResponse>(
                API_ENDPOINTS.RECOMMENDATIONS.GENERATE,
                {
                    scan_history: scanHistory,
                    total_scans: totalScans,
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error generating recommendations:', error);
            if (error.response) {
                throw new Error(error.response.data.detail || 'Failed to generate recommendations');
            }
            throw new Error('Network error. Please check your connection.');
        }
    }
}

export const recommendationsAPIService = new RecommendationsAPIService();

