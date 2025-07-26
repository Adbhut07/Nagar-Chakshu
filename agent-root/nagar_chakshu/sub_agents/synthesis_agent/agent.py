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
from ..util import CATEGORY_VALIDITY_DURATION, encode

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
    PROCESSED_DATA_COLLECTION = "processed_data"
    SUMMARIZED_DATA_COLLECTION = "summarized_data"
    
    
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


class SynthesisAgent:
    """Main service class for data fusing operations"""
    
    def __init__(self):
        self.firebase_manager = FirebaseManager()
        self.processed_data: List[Dict[str, Any]] = []
        self.summarized_data: List[Dict[str, Any]] = []
        
    async def get_processed_data(self) -> List[Dict[str, Any]]:
        """Fetch user submitted reports from Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.PROCESSED_DATA_COLLECTION)
            docs = collection_ref.stream()
            self.processed_data = [doc.to_dict() for doc in docs]
            print(f"Fetched {len(self.processed_data)} processed data entries from Firestore.")
            return self.processed_data
        except Exception as e:
            logger.error(f"Error fetching user reports: {e}")
            return []
        
        
    def synthesize_processed_data(self) -> List[Dict[str, Any]]:
        """Remove duplicates and summarize processed data"""
        self.summarized_data = []
        
        if not self.processed_data:
            return self.summarized_data
        
        # Keep track of which data points have been clustered
        processed_indices = set()
        cluster_id = 0
        
        for i, data_point in enumerate(self.processed_data):
            if i in processed_indices:
                continue
                
            # Start a new cluster with current data point
            cluster = [data_point]
            processed_indices.add(i)
            
            # Find all other points that should be in same cluster
            for j, other_point in enumerate(self.processed_data):
                if j in processed_indices or i == j:
                    continue
                
                # Check if they should be clustered together
                if self._should_cluster_together(data_point, other_point):
                    cluster.append(other_point)
                    processed_indices.add(j)
            
            # Create cluster summary
            cluster_summary = self._create_cluster_summary(cluster, cluster_id)
            self.summarized_data.append(cluster_summary)
            cluster_id += 1
        
        print(len(self.summarized_data), "clusters created from processed data.")
        
        return self.summarized_data

    def _should_cluster_together(self, data_point: Dict, other_point: Dict) -> bool:
        """Check if two points should be in the same cluster"""
        
        point1 = data_point.get('coordinates', {})
        point2 = other_point.get('coordinates', {})
        
        # Check distance (must be within 100m)
        lat1 = point1.get('lat', 0)
        lng1 = point1.get('lng', 0)
        lat2 = point2.get('lat', 0)
        lng2 = point2.get('lng', 0)
        
        # Skip if coordinates are missing
        if not all([lat1, lng1, lat2, lng2]):
            return False
        
        distance = self._calculate_distance(lat1, lng1, lat2, lng2)
        
        if distance > 5:  # 100m = 0.1km
            return False
        
        # Check if any categories match
        categories1 = data_point.get('categories', [])
        categories2 = other_point.get('categories', [])
        
        
        
        # Handle single category (convert to list)
        if isinstance(categories1, str):
            categories1 = [categories1]
        if isinstance(categories2, str):
            categories2 = [categories2]
        
        # Check if any category overlaps
        if not categories1 or not categories2:
            return False
            
        return bool(set(categories1) & set(categories2))  # True if any common categories

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in kilometers"""
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return c * 6371  # Earth radius in km
    
    def get_intelligent_summary(self, cluster_data: List[Dict[str, Any]]) -> str:
        """Generate an intelligent summary for a cluster using Gemini model"""
        try:
            # Prepare input text
            input_text = " ".join([data.get('description', '') for data in cluster_data])
            
            prompt = f"Generate a concise but bit detailed summary for the following data points:\n{input_text}\n\nSummary:"
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Summary generation failed due to an error."
        
    def get_intelligent_advice(self, intelligent_summary: str) -> str:
        """Generate intelligent advice based on the summary using Gemini model"""
        try:
            prompt = f"Based on the following summary, provide actionable advice in few lines:\n{intelligent_summary}\n\nAdvice:"
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating advice: {e}")
            return "Advice generation failed due to an error."
        
    def get_resolution_time(self,categories: list[str]) -> datetime:
        """Returns the latest valid_upto from the matched categories."""
        durations = [
            CATEGORY_VALIDITY_DURATION.get(cat, timedelta(hours=1))  # default to 1hr
            for cat in categories
        ]
        return datetime.now() + max(durations, default=timedelta(hours=1))
    
    def _create_cluster_summary(self, cluster_data: List[Dict], cluster_id: int) -> Dict[str, Any]:
        """Create summary for a cluster"""
        
        # Basic info
        cluster_size = len(cluster_data)
        
        lat = cluster_data[0].get('coordinates', {}).get('lat', 0)
        lng = cluster_data[0].get('coordinates', {}).get('lng', 0)
        
        location = cluster_data[0].get('location', 'Unknown Location')
        source_city = cluster_data[0].get('source_city', 'Unknown City')
        
        
        # Collect all categories
        all_categories = []
        for data_point in cluster_data:
            categories = data_point.get('categories', [])
            if isinstance(categories, str):
                categories = [categories]
            all_categories.extend(categories)
        
        # Count unique categories
        unique_categories = list(set(all_categories))
        
        intelligent_cluster_summary  =  self.get_intelligent_summary(cluster_data)
        intelligent_advice = self.get_intelligent_advice(intelligent_cluster_summary)
        image_urls = [data.get('image_url') for data in cluster_data if 'image_url' in data]
        descriptions = [data.get('description', '') for data in cluster_data]
        resolution_time = self.get_resolution_time(unique_categories)
        
        
        hash_code = encode(lat, lng, precision=9)
        
        
        return {
            'summary': intelligent_cluster_summary,
            'cluster_id': cluster_id,
            'occurrences': cluster_size,
            'resolution_time': resolution_time,
            'coordinates': {
                'lat': lat,
                'lng': lng
            },
            'categories': unique_categories,
            'advice': intelligent_advice,
            'descriptions': descriptions,
            'location': location,
            'source_city': source_city,
            'geohash':hash_code,
            'votes':0
        }
        
    def store_summaries(self) -> None:
        """Store summarized data in Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.SUMMARIZED_DATA_COLLECTION)
            
            for summary in self.summarized_data:
                collection_ref.add(summary)  # ← generates random doc ID automatically
            
            logger.info(f"Stored {len(self.summarized_data)} summarized data entries in Firestore.")
        except Exception as e:
            logger.error(f"Error storing summaries: {e}")

    
    
# Initialize the service
service = SynthesisAgent()

GEMINI_MODEL = "gemini-2.0-flash"  # Example model, replace with actual model if needed

# Create the Data Fusing Agent
synthesis_agent = Agent(
    name="synthesis_agent",
    model=GEMINI_MODEL,
    description="""
    This agent is responsible for synthesizing data from a firebase database collection.
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_processed_data to fetch processed_data from an API.
    2. Call synthesis_processed_data to remove duplicates region data and summarize the data.
    4. Call store_summaries to save summarized data analyzed results.
    
    Handle errors gracefully and provide detailed feedback for each step.

    """,
    tools=[
        service.get_processed_data,
        service.synthesize_processed_data,
        service.store_summaries
    ]
)
