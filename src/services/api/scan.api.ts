/**
 * Scan Analysis API Service
 * Handles communication with FastAPI backend for skin disease detection
 */
import axios, { AxiosInstance } from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { API_ENDPOINTS, ScanAnalysisResponse } from './api.config';

class ScanAPIService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_ENDPOINTS.BASE_URL,
            timeout: 60000, // 60 seconds timeout for model inference
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Analyze image from local file URI
     * Converts image to base64 and sends to API
     */
    async analyzeImageFromUri(imageUri: string): Promise<ScanAnalysisResponse> {
        try {
            // Read image as base64 using expo-file-system legacy API
            // Using legacy API to avoid deprecation warnings in v19
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Determine MIME type from URI
            const mimeType = imageUri.toLowerCase().endsWith('.png') 
                ? 'image/png' 
                : 'image/jpeg';
            const imageBase64 = `data:${mimeType};base64,${base64}`;

            const fullUrl = `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SCAN.ANALYZE_BASE64}`;
            console.log(`[API] Sending image to: ${fullUrl}`);
            console.log(`[API] Image size: ${base64.length} bytes (base64)`);
            console.log(`[API] Base URL: ${API_ENDPOINTS.BASE_URL}`);

            // Send to API
            const apiResponse = await this.client.post<ScanAnalysisResponse>(
                API_ENDPOINTS.SCAN.ANALYZE_BASE64,
                {
                    image_base64: imageBase64,
                }
            );

            console.log('[API] Response received:', apiResponse.status);
            return apiResponse.data;
        } catch (error: any) {
            console.error('[API] Error analyzing image:', error);
            console.error('[API] Error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url,
                baseURL: this.client.defaults.baseURL,
                fullURL: error.config?.url ? `${this.client.defaults.baseURL}${error.config.url}` : 'N/A',
            });
            
            // Provide helpful error messages
            if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                const helpfulMessage = `Cannot connect to backend API at ${this.client.defaults.baseURL}.\n\n` +
                    `Please check:\n` +
                    `1. Backend server is running (cd backend && python -m app.main)\n` +
                    `2. API URL is correct in .env file\n` +
                    `3. Device and computer are on same network\n` +
                    `4. Firewall isn't blocking port 8000`;
                throw new Error(helpfulMessage);
            }
            
            if (error.response) {
                const detail = error.response.data?.detail || error.response.data?.error || 'Failed to analyze image';
                throw new Error(detail);
            }
            if (error.message) {
                throw error;
            }
            throw new Error(`Network error: ${error.message || 'Unknown error'}. Please check your connection and ensure the backend server is running at ${this.client.defaults.baseURL}`);
        }
    }

    /**
     * Analyze image from base64 string
     */
    async analyzeImageFromBase64(imageBase64: string): Promise<ScanAnalysisResponse> {
        try {
            const response = await this.client.post<ScanAnalysisResponse>(
                API_ENDPOINTS.SCAN.ANALYZE_BASE64,
                {
                    image_base64: imageBase64,
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error analyzing image:', error);
            if (error.response) {
                throw new Error(error.response.data.detail || 'Failed to analyze image');
            }
            throw new Error('Network error. Please check your connection.');
        }
    }

    /**
     * Check if API is healthy
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get(API_ENDPOINTS.HEALTH.CHECK);
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

export const scanAPIService = new ScanAPIService();


