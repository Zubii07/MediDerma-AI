"""
FastAPI Main Application
MediDerma AI Backend - Skin Disease Detection & Weather-based Predictions
"""
import os
# Force PyTorch backend for transformers (must be before any imports)
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import scan, weather, health, recommendations
from app.services.model_service import ModelService
import logging

logging.basicConfig(level=logging.INFO)

# Global model service instance
model_service: ModelService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    global model_service
    
    # Startup: Load model
    import os
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "final_model")
    model_path = os.path.abspath(model_path)
    print(f"Loading skin disease detection model from: {model_path}")
    model_service = ModelService(model_path=model_path, device=settings.MODEL_DEVICE)
    await model_service.load_model()
    app.state.model_service = model_service
    print("Model loaded successfully!")
    
    yield
    
    # Shutdown: Cleanup
    print("Shutting down...")


app = FastAPI(
    title="MediDerma AI API",
    description="Skin Disease Detection & Weather-based Health Predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scan Analysis"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather Predictions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )

