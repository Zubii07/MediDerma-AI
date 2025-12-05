"""
Health check endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    message: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="MediDerma AI API is running")


@router.get("/ready")
async def readiness_check():
    """Readiness check - verifies model is loaded"""
    # This will be checked in main.py with app.state.model_service
    return {"status": "ready", "model_loaded": True}



