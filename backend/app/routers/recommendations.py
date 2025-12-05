"""
Recommendations Endpoint
Generates personalized health recommendations based on user's scan history
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import logging
from pydantic import BaseModel

from app.services.disease_info_service import DiseaseInfoService
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ScanHistoryItem(BaseModel):
    """Individual scan item from user's history"""
    disease: str
    confidence: float
    detected_at: str
    severity: str | None = None


class RecommendationsRequest(BaseModel):
    """Request body for recommendations"""
    scan_history: List[ScanHistoryItem]
    total_scans: int


def get_disease_info_service() -> DiseaseInfoService:
    """Dependency to get disease info service"""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    return DiseaseInfoService(api_key=settings.GEMINI_API_KEY)


@router.post("/generate")
async def generate_recommendations(
    request: RecommendationsRequest
) -> Dict[str, Any]:
    """
    Generate personalized health recommendations based on user's scan history
    
    Request body:
        {
            "scan_history": [
                {
                    "disease": "Eczema",
                    "confidence": 0.95,
                    "detected_at": "2025-11-25T10:00:00Z",
                    "severity": "moderate"
                }
            ],
            "total_scans": 5
        }
    """
    try:
        if not request.scan_history or len(request.scan_history) == 0:
            return {
                "success": True,
                "recommendations": [
                    "Start by uploading your first skin scan to get personalized recommendations.",
                    "Regular skin monitoring can help detect issues early.",
                    "Maintain good skin hygiene and use sunscreen daily."
                ],
                "insights": [],
                "action_items": []
            }
        
        disease_info_service = get_disease_info_service()
        
        # Analyze scan history
        disease_counts: Dict[str, int] = {}
        recent_diseases: List[str] = []
        high_confidence_count = 0
        
        for scan in request.scan_history:
            disease = scan.disease
            disease_counts[disease] = disease_counts.get(disease, 0) + 1
            recent_diseases.append(disease)
            if scan.confidence >= 0.70:
                high_confidence_count += 1
        
        # Get most common diseases
        most_common = sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        most_common_diseases = [disease for disease, count in most_common]
        
        # Create prompt for Gemini
        prompt = f"""You are a dermatology health advisor. Based on a user's skin scan history, provide personalized health recommendations.

User's Scan History:
- Total scans: {request.total_scans}
- Most frequently detected conditions: {', '.join(most_common_diseases) if most_common_diseases else 'None'}
- Recent conditions detected: {', '.join(recent_diseases[-5:]) if recent_diseases else 'None'}
- High confidence detections: {high_confidence_count} out of {len(request.scan_history)}

Provide recommendations in JSON format with this structure:
{{
    "personalized_recommendations": [
        "Personalized recommendation 1 based on their scan history (specific to detected diseases)",
        "Personalized recommendation 2 based on their patterns",
        "Personalized recommendation 3 tailored to their conditions"
    ],
    "generic_recommendations": [
        "Generic recommendation 1 (general skin health tip)",
        "Generic recommendation 2 (universal best practice)",
        "Generic recommendation 3 (preventive measure)"
    ],
    "insights": [
        "Insight 1 about their skin health patterns",
        "Insight 2",
        "Insight 3"
    ],
    "action_items": [
        "Action item 1 (specific next step)",
        "Action item 2",
        "Action item 3"
    ]
}}

Requirements:
- personalized_recommendations: 2-3 recommendations SPECIFIC to their scan history and detected diseases
- generic_recommendations: 2-3 general skin health recommendations that apply to everyone (e.g., sunscreen, hydration, regular checkups)
- Insights should highlight patterns or concerns from their scan history
- Action items should be clear next steps
- Focus on prevention, monitoring, and when to seek professional help
- Keep each item concise (1-2 sentences)
- Return ONLY valid JSON, no markdown or code blocks"""

        # Generate recommendations from Gemini
        logger.info(f"Generating recommendations from Gemini for user with {request.total_scans} scans")
        logger.info(f"Scan history: {len(request.scan_history)} scans with diseases")
        logger.info(f"Most common diseases: {most_common_diseases}")
        
        try:
            logger.info("Calling Gemini API to generate personalized recommendations...")
            response = disease_info_service.model.generate_content(prompt)
            logger.info(f"Gemini response received, length: {len(response.text)} characters")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")
        
        # Parse response
        import json
        import re
        
        response_text = response.text.strip()
        
        # Remove markdown formatting
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Extract JSON
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        try:
            recommendations_data = json.loads(response_text)
            logger.info("✅ Successfully parsed Gemini response as JSON")
            logger.info(f"   - Personalized recommendations: {len(recommendations_data.get('personalized_recommendations', []))}")
            logger.info(f"   - Generic recommendations: {len(recommendations_data.get('generic_recommendations', []))}")
            logger.info(f"   - Insights: {len(recommendations_data.get('insights', []))}")
            logger.info(f"   - Action items: {len(recommendations_data.get('action_items', []))}")
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Gemini recommendations: {e}")
            logger.error(f"   Response text (first 500 chars): {response_text[:500]}")
            # Fallback recommendations
            recommendations_data = {
                "personalized_recommendations": [
                    "Continue monitoring your skin regularly with scans",
                    f"Based on your scan history, focus on managing {most_common_diseases[0] if most_common_diseases else 'skin health'}"
                ],
                "generic_recommendations": [
                    "Maintain good skin hygiene and moisturize daily",
                    "Use sunscreen with SPF 30+ when outdoors",
                    "Consult a dermatologist if you notice any changes"
                ],
                "insights": [
                    f"You have {request.total_scans} scan(s) in your history",
                    f"Most common condition: {most_common_diseases[0] if most_common_diseases else 'None detected'}"
                ],
                "action_items": [
                    "Schedule regular skin check-ups",
                    "Keep track of any skin changes"
                ]
            }
        
        # Combine personalized and generic recommendations
        personalized = recommendations_data.get("personalized_recommendations", [])
        generic = recommendations_data.get("generic_recommendations", [])
        
        # If old format (just "recommendations"), use it and add generic
        if not personalized and not generic:
            old_recommendations = recommendations_data.get("recommendations", [])
            personalized = old_recommendations[:2] if len(old_recommendations) >= 2 else old_recommendations
            generic = [
                "Use sunscreen with SPF 30+ when outdoors",
                "Maintain good skin hygiene and moisturize daily",
                "Stay hydrated and maintain a healthy diet"
            ]
        
        # Combine: personalized first, then generic
        all_recommendations = personalized + generic
        
        return {
            "success": True,
            "recommendations": all_recommendations,
            "personalized_recommendations": personalized,
            "generic_recommendations": generic,
            "insights": recommendations_data.get("insights", []),
            "action_items": recommendations_data.get("action_items", [])
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        # Return fallback recommendations
        return {
            "success": True,
            "recommendations": [
                "Continue monitoring your skin regularly with scans",
                "Maintain good skin hygiene and moisturize daily",
                "Use sunscreen with SPF 30+ when outdoors",
                "Consult a dermatologist for any concerns"
            ],
            "personalized_recommendations": [
                "Continue monitoring your skin regularly with scans"
            ],
            "generic_recommendations": [
                "Maintain good skin hygiene and moisturize daily",
                "Use sunscreen with SPF 30+ when outdoors",
                "Consult a dermatologist for any concerns"
            ],
            "insights": [],
            "action_items": []
        }

