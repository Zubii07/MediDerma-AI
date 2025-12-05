"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # Firebase Admin
    FIREBASE_PROJECT_ID: str = "ai-skin-disease-app"
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"
    
    # Weather API
    WEATHER_API_KEY: str = "21d44e706e651ea9f1e5309e14f1cb24"
    
    # Gemini API
    GEMINI_API_KEY: str = "AIzaSyCp9AnkElVxBg6MCRpiRkhMoAuhwudL8rk"
    
    # Model Configuration
    MODEL_PATH: str = "../final_model"  # Relative to backend directory
    MODEL_DEVICE: str = "cpu"  # 'cpu' or 'cuda'
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:8081,http://localhost:19006"
    
    @property
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

