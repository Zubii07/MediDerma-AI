"""
Weather-based Disease Prediction Endpoints
Provides skin health recommendations based on location and weather
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
import requests
import logging
import google.generativeai as genai

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    city: str | None = None
    country: str | None = None


class WeatherDiseaseResponse(BaseModel):
    location: Dict[str, Any]
    weather: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    potential_diseases: List[Dict[str, Any]]
    recommendations: List[str]
    precautions: List[str]


def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch weather data from OpenWeatherMap API"""
    if not settings.WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key not configured")
    
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.WEATHER_API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")


def analyze_weather_for_skin_health(weather_data: Dict[str, Any], location: str) -> Dict[str, Any]:
    """Use Gemini API to analyze weather conditions and predict potential skin diseases"""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    temp = weather_data.get("main", {}).get("temp", 0)
    humidity = weather_data.get("main", {}).get("humidity", 0)
    feels_like = weather_data.get("main", {}).get("feels_like", temp)
    conditions = weather_data.get("weather", [{}])[0].get("description", "")
    wind_speed = weather_data.get("wind", {}).get("speed", 0)
    
    # Determine temperature category for better disease prediction
    temp_category = "cold" if temp < 10 else "cool" if temp < 20 else "moderate" if temp < 30 else "warm" if temp < 35 else "hot"
    
    prompt = f"""You are a dermatology expert. Analyze the current weather conditions in {location} and provide SPECIFIC skin health recommendations based on the EXACT temperature and weather conditions.

CURRENT WEATHER CONDITIONS IN {location}:
- Temperature: {temp}°C (feels like {feels_like}°C)
- Temperature Category: {temp_category}
- Humidity: {humidity}%
- Weather Conditions: {conditions}
- Wind Speed: {wind_speed} m/s

IMPORTANT: Your response MUST be specific to these EXACT weather conditions. Different temperatures cause different skin issues:
- COLD (<10°C): Dry skin, chapping, frostbite risk, eczema flare-ups
- COOL (10-20°C): Dry skin, mild eczema, windburn
- MODERATE (20-30°C): Balanced, but watch for sun exposure
- WARM (30-35°C): Heat rash, increased sweating, acne, sunburn risk
- HOT (>35°C): Severe sunburn, heat rash, dehydration, heat exhaustion

Provide analysis in this JSON structure:
{{
    "risk_level": "low/moderate/high",
    "potential_diseases": [
        {{
            "name": "specific disease name (e.g., Heat Rash, Sunburn, Dry Skin, Eczema, Acne, Frostbite)",
            "risk": "low/moderate/high",
            "reason": "specific explanation of why this disease is likely in {temp}°C temperature with {humidity}% humidity and {conditions} conditions"
        }}
    ],
    "recommendations": [
        "specific recommendation 1 tailored to {temp}°C temperature",
        "specific recommendation 2 for {conditions} weather",
        "specific recommendation 3 based on {humidity}% humidity"
    ],
    "precautions": [
        "specific precaution 1 for {temp}°C conditions",
        "specific precaution 2 for {location} weather",
        "specific precaution 3 based on current conditions"
    ],
    "uv_risk": "low/moderate/high",
    "humidity_impact": "specific description of how {humidity}% humidity affects skin in {temp}°C temperature"
}}

REQUIREMENTS:
- List 3-5 potential skin diseases that are SPECIFIC to {temp}°C temperature
- Each disease reason must explain WHY it's relevant for these EXACT conditions
- Recommendations must be actionable and specific to current temperature
- Precautions must be tailored to {location} weather conditions
- Content MUST vary based on temperature - cold weather = different diseases than hot weather
- Return ONLY valid JSON, no markdown formatting or code blocks"""

    try:
        logger.info(f"Calling Gemini API for weather analysis in {location}")
        logger.info(f"Weather conditions: {temp}°C, {humidity}% humidity, {conditions}")
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        logger.info(f"Gemini response received, length: {len(response_text)} characters")
        
        # Clean response text
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        import json
        import re
        
        # Try to extract JSON if there's extra text
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        try:
            analysis = json.loads(response_text)
            logger.info(f"✅ Successfully parsed Gemini weather analysis")
            logger.info(f"   - Risk level: {analysis.get('risk_level', 'N/A')}")
            logger.info(f"   - Potential diseases: {len(analysis.get('potential_diseases', []))}")
            logger.info(f"   - Recommendations: {len(analysis.get('recommendations', []))}")
            logger.info(f"   - Precautions: {len(analysis.get('precautions', []))}")
            return analysis
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Gemini response as JSON: {e}")
            logger.error(f"   Response text (first 500 chars): {response_text[:500]}")
            raise
    except Exception as e:
        logger.error(f"Error analyzing weather with Gemini: {str(e)}")
        # Fallback response with temperature-based diseases
        temp_category = "cold" if temp < 10 else "cool" if temp < 20 else "moderate" if temp < 30 else "warm" if temp < 35 else "hot"
        
        fallback_diseases = []
        if temp_category == "cold":
            fallback_diseases = [
                {"name": "Dry Skin", "risk": "high", "reason": f"Cold temperatures ({temp}°C) can cause skin dryness and chapping"},
                {"name": "Eczema Flare-ups", "risk": "moderate", "reason": "Cold weather can trigger or worsen eczema symptoms"},
            ]
        elif temp_category == "hot":
            fallback_diseases = [
                {"name": "Sunburn", "risk": "high", "reason": f"High temperatures ({temp}°C) increase sunburn risk"},
                {"name": "Heat Rash", "risk": "moderate", "reason": "Hot weather can cause heat rash from excessive sweating"},
            ]
        else:
            fallback_diseases = [
                {"name": "Sun Damage", "risk": "moderate", "reason": f"Moderate temperatures ({temp}°C) still require sun protection"},
            ]
        
        return {
            "risk_level": "moderate",
            "potential_diseases": fallback_diseases,
            "recommendations": [
                f"Use sunscreen with SPF 30+ in {temp}°C weather",
                "Stay hydrated to maintain skin health",
                "Protect skin from extreme weather conditions"
            ],
            "precautions": [
                "Avoid prolonged sun exposure",
                "Moisturize regularly",
                "Wear protective clothing when needed"
            ],
            "uv_risk": "moderate",
            "humidity_impact": f"{humidity}% humidity in {temp}°C temperature can affect skin moisture levels"
        }


@router.post("/predict", response_model=WeatherDiseaseResponse)
async def predict_weather_diseases(request: LocationRequest) -> WeatherDiseaseResponse:
    """
    Get skin disease predictions and recommendations based on location and weather
    
    Returns:
        - Weather data for the location
        - Risk assessment
        - Potential diseases that could occur
        - Recommendations and precautions
    """
    try:
        # Fetch weather data
        weather_data = get_weather_data(request.latitude, request.longitude)
        
        # Prepare location string
        location_str = request.city or f"{request.latitude}, {request.longitude}"
        if request.country:
            location_str += f", {request.country}"
        
        # Analyze weather for skin health
        analysis = analyze_weather_for_skin_health(weather_data, location_str)
        
        # Extract weather info
        main = weather_data.get("main", {})
        weather_desc = weather_data.get("weather", [{}])[0]
        
        # Calculate UV risk (simplified - you may want to use a UV API)
        uv_risk = analysis.get("uv_risk", "moderate")
        
        return WeatherDiseaseResponse(
            location={
                "latitude": request.latitude,
                "longitude": request.longitude,
                "city": request.city,
                "country": request.country
            },
            weather={
                "temperature": main.get("temp"),
                "humidity": main.get("humidity"),
                "conditions": weather_desc.get("description"),
                "feels_like": main.get("feels_like")
            },
            risk_assessment={
                "overall_risk": analysis.get("risk_level", "moderate"),
                "uv_risk": uv_risk,
                "humidity_impact": analysis.get("humidity_impact", "")
            },
            potential_diseases=analysis.get("potential_diseases", []),
            recommendations=analysis.get("recommendations", []),
            precautions=analysis.get("precautions", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting weather diseases: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing weather prediction: {str(e)}")


