from google.adk.agents import Agent
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
import firebase_admin
import httpx
from firebase_admin import credentials, firestore
from google.adk.agents import Agent
from google.cloud.firestore_v1 import GeoPoint, Increment
import requests
import dotenv
from dotenv import load_dotenv
from typing import List, Dict, Tuple
import random
from datetime import datetime, timedelta
from google.generativeai import GenerativeModel
import google.generativeai as genai
import math
from ..util import PROMPT_PREDICTIVE_ANALYSIS



load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)



genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = GenerativeModel("gemini-1.5-pro")

class FirestoreConfig:
    """Configuration constants for Firestore collections"""
    SUMMARIZED_DATA_COLLECTION = "summarized_data"
    PREDICTIVE_DATA_COLLECTION = "predictive_data"


class FirebaseManager:
    """Manages Firebase initialization and operations"""
    
    def __init__(self):
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase initialized with credentials from: {cred_path}")
                else:
                    firebase_admin.initialize_app()
                    logger.info("Firebase initialized with default credentials")
            
            self.db = firestore.client()
            logger.info("Firestore client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
        
        
        
        
class PredictiveAgent:
    
    def __init__(self):
        self.firebase_manager = FirebaseManager()
        self.summarized_data: List[Dict[str, Any]] = []
        self.predicitve_data: List[Dict[str, Any]] = []
        
    async def get_summarized_data(self) -> List[Dict[str, Any]]:
        """Fetch summarized data from Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.SUMMARIZED_DATA_COLLECTION)
            docs = collection_ref.stream()
            self.summarized_data = [doc.to_dict() for doc in docs]
            print(f"Fetched {len(self.summarized_data)} summarized data entries from Firestore.")
            return self.summarized_data
        except Exception as e:
            logger.error(f"Error fetching summarized data{e}")
            return []
        
    def make_predictions(self) -> List[Dict[str, Any]]:
        """Analyze sentiment of the fetched data"""

        if not self.summarized_data:
            logger.warning("No data to Predict.")
            return []
        
        self.predicitve_data = []
        
        for data in self.summarized_data:
            summary = data.get('summary', '')
            if not summary:
                logger.warning("No summary found for data entry.")
                continue
            
            try:
                
                prompt = f"{PROMPT_PREDICTIVE_ANALYSIS} {summary}"
              
                response = model.generate_content(prompt )
                prediction = response.text.strip()
                
                # Adjust the resolution time based on the prediction
                resolution_time = data.get('resolution_time')
                resolution_time += timedelta(hours=6)  # Example adjustment, can be customized
                
                data_with_prediction = {
                    "coordinates": data.get('coordinates', {'lat': 0, 'lng': 0}),
                    "geohash": data.get('geohash', ''),
                    "location": data.get('location', ''),
                    "source_city": data.get('source_city', ''),
                    "resolution_time": resolution_time,
                    "prediction": prediction,
                }
                
                self.predicitve_data.append(data_with_prediction)
                
            except Exception as e:                              
                logger.error(f"Error analyzing predictive for data entry {data.get('id', 'unknown')}: {e}")
                
        return self.predicitve_data
    
    
    
    
    def store_predictive_data(self) -> None:
        """Store summarized data in Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.PREDICTIVE_DATA_COLLECTION)
            
            for data in self.predicitve_data:
                collection_ref.add(data)  # ← generates random doc ID automatically
            
            logger.info(f"Stored {len(self.sentiment_data)} predictive data entries in Firestore.")
        except Exception as e:
            logger.error(f"Error storing predictive data: {e}")
        
        
service = PredictiveAgent()


GEMINI_MODEL = "gemini-2.0-flash"  # Example model, replace with actual model if needed

# Create the Data Fusing Agent
predictive_agent = Agent(
    name="predictive_agent",
    model=GEMINI_MODEL,
    description="""
    This agent is responsible for the predictive analysis of data. It fetches summarized data from a Firebase database, predicts future trends based on the data, and stores the results back in the database.
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_summarzied_data to fetch summarized data from an firebase database.
    2. Call make_predictions to make predictions based on the summarized data. and store the results in the prediction attribute.
    4. Call store_predictive_data to save predictive data analyzed results.
    
    Handle errors gracefully and provide detailed feedback for each step.

    """,
    tools=[
        service.get_summarized_data,
        service.make_predictions,
        service.store_predictive_data
    ]
)
        

