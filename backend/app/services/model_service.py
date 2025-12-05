"""
Model Service for Skin Disease Detection
Handles loading and inference with the trained ViT model
"""
import os
# Force transformers to use PyTorch backend
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import torch
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import numpy as np
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Disease categories mapping
DISEASE_CATEGORIES = {
    0: "Acne",
    1: "BCC",  # Basal Cell Carcinoma
    2: "Eczema",
    3: "Melanoma",
    4: "Psoriasis",
    5: "SCC"  # Squamous Cell Carcinoma
}


class ModelService:
    """Service for running skin disease detection model inference"""
    
    def __init__(self, model_path: str, device: str = "cpu"):
        self.model_path = model_path
        self.device = device if torch.cuda.is_available() and device == "cuda" else "cpu"
        self.model: Optional[ViTForImageClassification] = None
        self.processor: Optional[ViTImageProcessor] = None
        self.is_loaded = False
    
    async def load_model(self):
        """Load the model and processor"""
        try:
            logger.info(f"Loading model from {self.model_path} on device: {self.device}")
            
            # Load processor
            self.processor = ViTImageProcessor.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                use_fast=True
            )
            
            # Load model with PyTorch backend
            self.model = ViTForImageClassification.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                torch_dtype=torch.float32
            )
            self.model.to(self.device)
            self.model.eval()  # Set to evaluation mode
            
            self.is_loaded = True
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for model input"""
        if not self.processor:
            raise RuntimeError("Model processor not loaded")
        
        # Process image according to preprocessor config
        inputs = self.processor(images=image, return_tensors="pt")
        return inputs.pixel_values.to(self.device)
    
    async def predict(self, image: Image.Image) -> Dict[str, any]:
        """
        Run inference on an image
        
        Returns:
            Dict with disease name, confidence score, and all class probabilities
        """
        if not self.is_loaded or not self.model:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Preprocess image
            pixel_values = self.preprocess_image(image)
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(pixel_values)
                logits = outputs.logits
            
            # Get probabilities using softmax
            probabilities = torch.nn.functional.softmax(logits, dim=-1)
            probabilities = probabilities.cpu().numpy()[0]
            
            # Get predicted class
            predicted_class_id = int(np.argmax(probabilities))
            confidence_score = float(probabilities[predicted_class_id])
            disease_name = DISEASE_CATEGORIES.get(predicted_class_id, "Unknown")
            
            # Get all class probabilities
            all_predictions = {
                DISEASE_CATEGORIES[i]: float(probabilities[i])
                for i in range(len(DISEASE_CATEGORIES))
            }
            
            return {
                "disease": disease_name,
                "confidence": confidence_score,
                "predicted_class_id": predicted_class_id,
                "all_predictions": all_predictions
            }
            
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise


