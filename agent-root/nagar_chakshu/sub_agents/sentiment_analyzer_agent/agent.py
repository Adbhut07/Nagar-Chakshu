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
from ..util import PROMPT_SENTIMENT_ANALYSIS



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
    SENTIMENT_DATA_COLLECTION = "sentiment_data"
    
    
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


class SentimentAnalyzerAgent:
    
    def __init__(self):
        self.firebase_manager = FirebaseManager()
        self.sentiment_data: List[Dict[str, Any]] = []
        self.summarized_data: List[Dict[str, Any]] = []
        
    async def get_summarized_data(self) -> List[Dict[str, Any]]:
        """Fetch user submitted reports from Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.SUMMARIZED_DATA_COLLECTION)
            docs = collection_ref.stream()
            self.summarized_data = [doc.to_dict() for doc in docs]
            print(f"Fetched {len(self.summarized_data)} summarized data entries from Firestore.")
            return self.summarized_data
        except Exception as e:
            logger.error(f"Error fetching summarized data{e}")
            return []
        
        
    def analyze_sentiment_data(self) -> List[Dict[str, Any]]:
        """Analyze sentiment of the fetched data"""

        if not self.summarized_data:
            logger.warning("No data to analyze sentiment.")
            return []
        
        self.sentiment_data = []
        
        for data in self.summarized_data:
            descriptions = data.get('descriptions', [])
            if not descriptions:
                logger.warning("No descriptions found for data entry.")
                continue
            
            # Combine all descriptions into a single text for sentiment analysis
            combined_text = " ".join(descriptions)
            
            
            try:
                
                prompt = f"{PROMPT_SENTIMENT_ANALYSIS} {combined_text}"
              
                response = model.generate_content(prompt )
                sentiment = response.text.strip()
                
                # Append the sentiment analysis result to the data entry
                
                data_with_sentiment = {
                    "coordinates": data.get('coordinates', {'lat': 0, 'lng': 0}),
                    "geohash": data.get('geohash', ''),
                    "location": data.get('location', ''),
                    "resolution_time": data.get('resolution_time', ''),
                    "categories": data.get('categories', []),
                    "sentiment": sentiment,
                }
                
                self.sentiment_data.append(data_with_sentiment)
                
            except Exception as e:                              
                logger.error(f"Error analyzing sentiment for data entry {data.get('id', 'unknown')}: {e}")
                
        return self.sentiment_data
        
    def store_sentiment_data(self) -> None:
        """Store summarized data in Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.SENTIMENT_DATA_COLLECTION)
            
            for data in self.sentiment_data:
                collection_ref.add(data)  # ← generates random doc ID automatically
            
            logger.info(f"Stored {len(self.sentiment_data)} sentiment data entries in Firestore.")
        except Exception as e:
            logger.error(f"Error storing sentiment data: {e}")


service = SentimentAnalyzerAgent()


GEMINI_MODEL = "gemini-2.0-flash"  # Example model, replace with actual model if needed

# Create the Data Fusing Agent
sentiment_analyzer_agent = Agent(
    name="sentiment_analyzer_agent",
    model=GEMINI_MODEL,
    description="""
    This agent is responsible for analyzing sentiments from the data from a firebase database collection.
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_summarzied_data to fetch summarized data from an firebase database.
    2. Call analyze_sentiment_data to perform sentiment analysis on the fetched data.
    4. Call store_sentiment_data to save sentiment data analyzed results.
    
    Handle errors gracefully and provide detailed feedback for each step.

    """,
    tools=[
        service.get_summarized_data,
        service.analyze_sentiment_data,
        service.store_sentiment_data
    ]
)