"""
Disease Information Service using Gemini API
Fetches symptoms, cure, description, and precautions for detected diseases
"""
import google.generativeai as genai
from typing import Dict, Optional
import logging
import os

logger = logging.getLogger(__name__)


class DiseaseInfoService:
    """Service for fetching disease information using Gemini API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        # Use gemini-2.0-flash (available and fast model)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    async def get_disease_info(self, disease_name: str) -> Dict[str, any]:
        """
        Get comprehensive information about a disease using Gemini API
        
        Args:
            disease_name: Name of the disease (e.g., "BCC", "Melanoma", "Acne")
        
        Returns:
            Dict with symptoms, cure, description, precautions
        """
        try:
            # Map disease names to full names for better context
            disease_full_names = {
                "BCC": "Basal Cell Carcinoma",
                "SCC": "Squamous Cell Carcinoma",
                "Melanoma": "Melanoma",
                "Acne": "Acne",
                "Eczema": "Eczema",
                "Psoriasis": "Psoriasis"
            }
            
            full_name = disease_full_names.get(disease_name, disease_name)
            
            # Create prompt for Gemini
            prompt = f"""You are a medical information assistant. Provide detailed information about {full_name} (a skin disease) in valid JSON format.

Return ONLY a JSON object with this exact structure (no markdown, no code blocks, no explanations):
{{
    "name": "{full_name}",
    "description": "A clear, concise description of what {full_name} is, its characteristics, and how it typically appears on the skin.",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3", "symptom 4"],
    "cure": "Detailed treatment options, medications, and management strategies for {full_name}. Include both medical treatments and home care options.",
    "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4"],
    "severity": "mild or moderate or severe",
    "when_to_see_doctor": "Specific guidance on when someone should seek professional medical attention for {full_name}, including warning signs and urgency indicators."
}}

Requirements:
- Return ONLY valid JSON, no other text
- Description should be 2-3 sentences
- Include 4-6 common symptoms
- Include 4-6 practical precautions
- Cure should be comprehensive (3-4 sentences)
- When_to_see_doctor should be specific and actionable (2-3 sentences)
- All information must be medically accurate"""

            # Generate response from Gemini
            logger.info(f"Fetching disease info from Gemini for: {full_name}")
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.3,  # Lower temperature for more consistent, factual responses
                        "top_p": 0.8,
                        "top_k": 40,
                    }
                )
                
                # Parse response (remove markdown code blocks if present)
                response_text = response.text.strip()
                logger.info(f"Gemini response length: {len(response_text)}")
                
                # Remove markdown formatting
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                elif response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                # Try to extract JSON if there's extra text
                import json
                import re
                
                # Try to find JSON object in the response
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(0)
                
                try:
                    disease_info = json.loads(response_text)
                    logger.info(f"Successfully parsed Gemini response for {full_name}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Gemini response as JSON: {e}")
                    logger.error(f"Response text: {response_text[:500]}")
                    # Fallback: create structured response from text
                    disease_info = {
                        "name": full_name,
                        "description": response_text[:300] if len(response_text) > 300 else response_text,
                        "symptoms": [],
                        "cure": "Please consult a dermatologist for proper treatment.",
                        "precautions": [],
                        "severity": "moderate",
                        "when_to_see_doctor": "Consult a healthcare professional for proper diagnosis and treatment."
                    }
            except Exception as api_error:
                logger.error(f"Gemini API error: {str(api_error)}")
                raise  # Re-raise to be caught by outer exception handler
            
            # Ensure all required fields exist
            return {
                "name": disease_info.get("name", full_name),
                "description": disease_info.get("description", ""),
                "symptoms": disease_info.get("symptoms", []),
                "cure": disease_info.get("cure", ""),
                "precautions": disease_info.get("precautions", []),
                "severity": disease_info.get("severity", "moderate"),
                "when_to_see_doctor": disease_info.get("when_to_see_doctor", "Consult a healthcare professional.")
            }
            
        except Exception as e:
            logger.error(f"Error fetching disease info from Gemini: {str(e)}")
            # Return fallback information
            return {
                "name": disease_name,
                "description": "Information temporarily unavailable. Please consult a dermatologist.",
                "symptoms": [],
                "cure": "Please consult a healthcare professional for proper diagnosis and treatment.",
                "precautions": ["Avoid excessive sun exposure", "Use sunscreen", "Keep skin moisturized"],
                "severity": "unknown",
                "when_to_see_doctor": "Consult a dermatologist for proper diagnosis and treatment."
            }


