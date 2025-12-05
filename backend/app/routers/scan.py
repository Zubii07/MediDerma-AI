"""
Scan Analysis Endpoints
Handles image upload, disease detection, and information retrieval
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from PIL import Image
import io
import logging
from typing import Dict, Any

from app.services.model_service import ModelService
from app.services.disease_info_service import DiseaseInfoService
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def get_model_service(request: Request) -> ModelService:
    """Dependency to get model service from app state"""
    if not hasattr(request.app.state, 'model_service') or not request.app.state.model_service:
        raise HTTPException(status_code=503, detail="Model service not available")
    return request.app.state.model_service


def get_disease_info_service() -> DiseaseInfoService:
    """Dependency to get disease info service"""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    return DiseaseInfoService(api_key=settings.GEMINI_API_KEY)


@router.post("/analyze")
async def analyze_scan(
    file: UploadFile = File(...),
    model_service: ModelService = Depends(get_model_service),
    disease_info_service: DiseaseInfoService = Depends(get_disease_info_service)
) -> Dict[str, Any]:
    """
    Analyze uploaded skin image for disease detection
    
    Returns:
        - disease: Detected disease name
        - confidence: Confidence score (0-1)
        - disease_info: Complete information (symptoms, cure, precautions, etc.)
        - all_predictions: Confidence scores for all disease categories
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Run model prediction
        logger.info(f"Running prediction on image: {file.filename}")
        prediction_result = await model_service.predict(image)
        
        disease_name = prediction_result["disease"]
        confidence = prediction_result["confidence"]
        
        # Get disease information from Gemini
        logger.info(f"Fetching disease information for: {disease_name}")
        disease_info = await disease_info_service.get_disease_info(disease_name)
        
        # Check confidence threshold
        CONFIDENCE_THRESHOLD = 0.70  # 70% confidence threshold
        is_low_confidence = confidence < CONFIDENCE_THRESHOLD
        
        # Check confidence threshold and multiple high-probability predictions
        CONFIDENCE_THRESHOLD = 0.70  # 70% confidence threshold
        all_predictions = prediction_result["all_predictions"]
        
        # Check if there are multiple diseases with similar probabilities (within 20%)
        sorted_predictions = sorted(all_predictions.items(), key=lambda x: x[1], reverse=True)
        top_prediction = sorted_predictions[0][1] if sorted_predictions else 0
        second_prediction = sorted_predictions[1][1] if len(sorted_predictions) > 1 else 0
        
        # Low confidence if: main prediction < 70% OR second prediction is within 20% of first
        is_low_confidence = confidence < CONFIDENCE_THRESHOLD or (top_prediction - second_prediction) < 0.20

        alternate_diseases = []
        if is_low_confidence and sorted_predictions:
            top_candidates = sorted_predictions[:3]
            candidate_infos: Dict[str, Any] = {}
            for disease_candidate, _ in top_candidates:
                if disease_candidate == disease_name:
                    candidate_infos[disease_candidate] = disease_info
                    continue
                try:
                    candidate_infos[disease_candidate] = await disease_info_service.get_disease_info(disease_candidate)
                except Exception as info_error:
                    logger.error(f"Failed to fetch Gemini info for {disease_candidate}: {info_error}")
                    candidate_infos[disease_candidate] = {
                        "name": disease_candidate,
                        "description": "Information temporarily unavailable. Please consult a dermatologist.",
                        "symptoms": [],
                        "cure": "Consult a healthcare professional for accurate treatment.",
                        "precautions": [],
                        "severity": "unknown",
                        "when_to_see_doctor": "Consult a dermatologist for proper diagnosis.",
                    }

            for disease_candidate, probability in top_candidates:
                alternate_diseases.append(
                    {
                        "name": disease_candidate,
                        "probability": probability,
                        "disease_info": candidate_infos.get(disease_candidate, {}),
                    }
                )

            generic_disease_info = {
                "name": "Multiple Possibilities",
                "description": "The analysis indicates multiple possible conditions. The image quality or clarity may be affecting the accuracy of the diagnosis.",
                "symptoms": [],
                "cure": "Please consult a dermatologist for proper diagnosis. Upload a clearer, well-lit image for better analysis results.",
                "precautions": [
                    "Monitor the affected area for any changes",
                    "Avoid scratching or irritating the area",
                    "Keep the area clean and dry",
                    "Consult a healthcare professional for proper diagnosis"
                ],
                "severity": "unknown",
                "when_to_see_doctor": "It is recommended to consult a dermatologist, especially if the condition persists, worsens, or if you have concerns about skin cancer (BCC, SCC, or Melanoma)."
            }
            disease_info = generic_disease_info
            confidence_warning = (
                "The image quality or clarity may be affecting the analysis. "
                "Based on the model predictions, this could be one of several conditions. "
                "Please upload a clearer, well-lit image of the affected area for more accurate results."
            )
        else:
            confidence_warning = None
        
        # Combine results
        response = {
            "success": True,
            "disease": disease_name,
            "confidence": confidence,
            "is_low_confidence": is_low_confidence,
            "confidence_warning": confidence_warning,
            "disease_info": disease_info,
            "all_predictions": prediction_result["all_predictions"],
            "alternate_diseases": alternate_diseases,
            "model_version": "1.0.0"
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing scan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")


@router.post("/analyze-base64")
async def analyze_scan_base64(
    request: Dict[str, Any],
    model_service: ModelService = Depends(get_model_service),
    disease_info_service: DiseaseInfoService = Depends(get_disease_info_service)
) -> Dict[str, Any]:
    """
    Analyze image from base64 string (useful for mobile apps)
    
    Request body:
        {
            "image_base64": "data:image/jpeg;base64,..."
        }
    """
    try:
        import base64
        
        image_base64 = request.get("image_base64", "")
        if not image_base64:
            raise HTTPException(status_code=400, detail="image_base64 is required")
        
        # Remove data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Run prediction
        prediction_result = await model_service.predict(image)
        disease_name = prediction_result["disease"]
        
        # Get disease information
        disease_info = await disease_info_service.get_disease_info(disease_name)
        
        # Check confidence threshold and multiple high-probability predictions
        CONFIDENCE_THRESHOLD = 0.70  # 70% confidence threshold
        confidence = prediction_result["confidence"]
        all_predictions = prediction_result["all_predictions"]
        
        # Check if there are multiple diseases with similar probabilities (within 20%)
        sorted_predictions = sorted(all_predictions.items(), key=lambda x: x[1], reverse=True)
        top_prediction = sorted_predictions[0][1] if sorted_predictions else 0
        second_prediction = sorted_predictions[1][1] if len(sorted_predictions) > 1 else 0
        
        # Low confidence if: main prediction < 70% OR second prediction is within 20% of first
        is_low_confidence = confidence < CONFIDENCE_THRESHOLD or (top_prediction - second_prediction) < 0.20

        alternate_diseases = []
        if is_low_confidence and sorted_predictions:
            top_candidates = sorted_predictions[:3]
            candidate_infos: Dict[str, Any] = {}
            for disease_candidate, _ in top_candidates:
                if disease_candidate == disease_name:
                    candidate_infos[disease_candidate] = disease_info
                    continue
                try:
                    candidate_infos[disease_candidate] = await disease_info_service.get_disease_info(disease_candidate)
                except Exception as info_error:
                    logger.error(f"Failed to fetch Gemini info for {disease_candidate}: {info_error}")
                    candidate_infos[disease_candidate] = {
                        "name": disease_candidate,
                        "description": "Information temporarily unavailable. Please consult a dermatologist.",
                        "symptoms": [],
                        "cure": "Consult a healthcare professional for accurate treatment.",
                        "precautions": [],
                        "severity": "unknown",
                        "when_to_see_doctor": "Consult a dermatologist for proper diagnosis.",
                    }

            for disease_candidate, probability in top_candidates:
                alternate_diseases.append(
                    {
                        "name": disease_candidate,
                        "probability": probability,
                        "disease_info": candidate_infos.get(disease_candidate, {}),
                    }
                )

            generic_disease_info = {
                "name": "Multiple Possibilities",
                "description": "The analysis indicates multiple possible conditions. The image quality or clarity may be affecting the accuracy of the diagnosis.",
                "symptoms": [],
                "cure": "Please consult a dermatologist for proper diagnosis. Upload a clearer, well-lit image for better analysis results.",
                "precautions": [
                    "Monitor the affected area for any changes",
                    "Avoid scratching or irritating the area",
                    "Keep the area clean and dry",
                    "Consult a healthcare professional for proper diagnosis"
                ],
                "severity": "unknown",
                "when_to_see_doctor": "It is recommended to consult a dermatologist, especially if the condition persists, worsens, or if you have concerns about skin cancer (BCC, SCC, or Melanoma)."
            }
            disease_info = generic_disease_info
            confidence_warning = (
                "The image quality or clarity may be affecting the analysis. "
                "Based on the model predictions, this could be one of several conditions. "
                "Please upload a clearer, well-lit image of the affected area for more accurate results."
            )
        else:
            confidence_warning = None
        
        return {
            "success": True,
            "disease": disease_name,
            "confidence": confidence,
            "is_low_confidence": is_low_confidence,
            "confidence_warning": confidence_warning,
            "disease_info": disease_info,
            "all_predictions": all_predictions,
            "alternate_diseases": alternate_diseases,
            "model_version": "1.0.0"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing base64 image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
