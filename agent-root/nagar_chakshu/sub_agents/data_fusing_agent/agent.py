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
from ..util import KEYWORDS, CATEGORY_VALIDITY_DURATION
import random
from datetime import datetime, timedelta

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FirestoreConfig:
    """Configuration constants for Firestore collections"""
    RAW_DATA_COLLECTION = "raw_data"
    PROCESSED_DATA_COLLECTION = "processed_data"


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


class DataProcessor:
    """Handles data processing and analysis operations"""
    
    @staticmethod
    def serialize_firestore_value(value: Any) -> Any:
        """Serialize Firestore values for JSON compatibility"""
        if isinstance(value, GeoPoint):
            return {"lat": value.latitude, "lng": value.longitude}
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, dict):
            return {k: DataProcessor.serialize_firestore_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [DataProcessor.serialize_firestore_value(v) for v in value]
        else:
            return value
    
    @staticmethod
    def normalize_coordinates(item: Dict[str, Any]) -> Optional[Dict[str, float]]:
        """Extract and normalize coordinate information"""
        coords = item.get('coordinates')
        
        # Handle list format [lat, lng]
        if isinstance(coords, list) and len(coords) >= 2:
            try:
                return {"lat": float(coords[0]), "lng": float(coords[1])}
            except (ValueError, TypeError):
                pass
        
        # Handle dict format
        if isinstance(coords, dict):
            lat = coords.get('lat') or coords.get('latitude')
            lng = coords.get('lng') or coords.get('longitude')
            if lat is not None and lng is not None:
                try:
                    return {"lat": float(lat), "lng": float(lng)}
                except (ValueError, TypeError):
                    pass
        
        # Handle separate lat/lng fields
        if 'latitude' in item and 'longitude' in item:
            try:
                return {"lat": float(item['latitude']), "lng": float(item['longitude'])}
            except (ValueError, TypeError):
                pass
        
        if 'lat' in item and 'lng' in item:
            try:
                return {"lat": float(item['lat']), "lng": float(item['lng'])}
            except (ValueError, TypeError):
                pass
        
        return None
    
    @staticmethod
    def extract_text_content(item: Dict[str, Any]) -> str:
        """Extract text content from data item for analysis"""
        text_content = ""
        
        # Primary text fields
        primary_fields = ['text', 'description', 'message', 'content']
        for field in primary_fields:
            if field in item and item[field]:
                text_content += f" {str(item[field])}"
        
        # Additional text fields
        additional_fields = ['details', 'info', 'title', 'summary']
        for field in additional_fields:
            if field in item and item[field]:
                text_content += f" {str(item[field])}"
        
        # If no text content found, use other string fields
        if not text_content.strip():
            excluded_fields = {
                'id', 'edit_history_tweet_ids', 'image_url', 'coordinates', 
                'fetched_at', 'api_endpoint', 'stored_at', 'analyzed_at'
            }
            text_content = " ".join([
                str(value) for key, value in item.items() 
                if isinstance(value, (str, int, float)) and key not in excluded_fields
            ])
        
        return text_content.lower() if text_content else ""
    
    @staticmethod
    def extract_location(item: Dict[str, Any]) -> str:
        """Extract location information from data item"""
        location_fields = ['location', 'address', 'place', 'source_city']
        for field in location_fields:
            if field in item and item[field]:
                return str(item[field])
        return "Unknown"
    
    @staticmethod
    def categorize_content(description: str, score_output: bool = False) -> List[str] | List[Tuple[str, int]]:
        """
        Returns a list of matched categories from the description.
        If score_output=True, returns a sorted list of tuples: (category, match_count).
        """
        description = description.lower()
        matched = {}

        for category, keywords in KEYWORDS.items():
            count = 0
            for keyword in keywords:
                # Use in-string match to allow phrase detection
                if keyword in description:
                    count += 1
            if count > 0:
                matched[category] = count

        if score_output:
            # Return categories sorted by most matches
            return sorted(matched.items(), key=lambda x: x[1], reverse=True)
        else:
            return list(matched.keys())
        
    @staticmethod
    def get_combined_advice(categories: List[str]) -> str:
        """
        Return a single, concise 2–3 line advice summary based on combined categories.
        """
        if not categories:
            return "No specific issues detected. Stay safe and follow local updates."

        parts = []

        if "emergency" in categories:
            parts.append("An emergency has been reported nearby.")
        if "traffic" in categories:
            parts.append("Expect traffic delays — consider alternate routes.")
        if "water-logging" in categories:
            parts.append("Avoid flooded areas and check for waterlogging.")
        if "weather" in categories:
            parts.append("Severe weather may affect visibility or safety.")
        if "public-transport" in categories:
            parts.append("Public transport may be delayed or disrupted.")
        if "infrastructure" in categories:
            parts.append("Watch out for damaged roads or civic works.")
        if "civic-issues" in categories:
            parts.append("Civic issues like garbage or pollution may be present.")
        if "security" in categories:
            parts.append("Stay alert to any suspicious or unsafe activity.")
        if "events" in categories:
            parts.append("Large gatherings may cause congestion in some areas.")
        if "stampede" in categories:
            parts.append("Avoid dense crowds due to potential safety risks.")
        if "utility" in categories:
            parts.append("There might be service interruptions like power or water cuts.")

        # Generate a clean summary
        summary = " ".join(parts)

        # Trim to ~2-3 lines, if needed
        if len(summary.split()) > 45:
            summary = "Multiple issues reported in your area. Please stay alert and follow local advisories."

        return summary
    


class DataFusingService:
    """Main service class for data fusing operations"""
    
    def __init__(self):
        self.firebase_manager = FirebaseManager()
        self.base_api_url = os.getenv("BASE_API_URL", "https://your-api-domain.com")
        self.raw_data: List[Dict[str, Any]] = []
        self.processed_data: List[Dict[str, Any]] = []
    
    
    
    async def get_live_data(self) -> Dict[str, Any]:
        """
        Tool 1: Get live data from API endpoint
        
        Returns:
            dict: Result with data or error information
        """
        api_endpoint = f"{self.base_api_url}/api/twitter-feed"
        take_data = 200 
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_endpoint, timeout=30)

            if response.status_code != 200:
                error_msg = f"API request failed with status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return {"error": error_msg, "status_code": response.status_code}

            api_response = response.json()
            data = api_response.get('data', api_response)

            # Normalize data structure
            if isinstance(data, dict):
                data = [data]
            elif not isinstance(data, list):
                data = [data] if data is not None else []

            # Randomly sample the data
            if len(data) > take_data:
                data = random.sample(data, take_data)

            self.raw_data = self._process_raw_data(data)

            print(f"Fetched {len(data)} random items")

            return {
                "status": "success",
                "data_count": len(self.raw_data),
                "message": f"Fetched {len(self.raw_data)} random items"
            }

        except httpx.TimeoutException:
            error_msg = f"Request timed out"
            logger.error(error_msg)
            return {"error": error_msg}

        except httpx.ConnectError:
            error_msg = f"Connection error"
            logger.error(error_msg)
            return {"error": error_msg}

        except Exception as e:
            error_msg = f"Unhandled error during API request: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
         
    def normalize_coordinates(self,item: Dict[str, Any]) -> Dict[str, float] | None:
        """
        Extract coordinates from item
        """
        coords = item.get("coordinates")
        if not coords:
            return {
                'lat': 0.0,
                'lng': 0.0
            }
        return {
            'lat':coords[0],
            'lng':coords[1]
        }
    
    
    def _process_raw_data(
        self,
        data: List[Any]
    ) -> List[Dict[str, Any]]:
        """Process raw data items with metadata, detecting city from coordinates"""
        processed_data = []
        current_time = datetime.now().isoformat()
        


        for item in data:
            processed_item = item.copy()

            processed_item.update({
                'fetched_at': current_time
            })

            processed_data.append(processed_item)

        return processed_data

    def _get_city_from_coordinates(self, coords: Dict[str, float]) -> str:
        """Get city name from coordinates using reverse geocoding"""
        try:
            lat = coords.get('latitude') or coords.get('lat')
            lng = coords.get('longitude') or coords.get('lng')

            if lat is None or lng is None:
                return "Unknown"

            # Use Nominatim (OpenStreetMap) for reverse geocoding
            city_name = self._reverse_geocode(lat, lng)
            return city_name if city_name else "Unknown"

        except Exception:
            return "Unknown"

    def _reverse_geocode(self, lat: float, lng: float) -> str:
        """Perform reverse geocoding to get city name using Google Maps Geocoding API"""
        try:
            # Get API key from environment variable
            api_key = os.getenv('GOOGLE_GEOCODING_API_KEY')
            if not api_key:
                return "Unknown"

            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'latlng': f"{lat},{lng}",
                'key': api_key
            }

            response = requests.get(url, params=params, timeout=5)
            
            
            if response.status_code == 200:
                results = response.json().get("results", [])
                for result in results:
                    for component in result.get("address_components", []):
                        types = component.get("types", [])
                        if "locality" in types:
                            return component.get("long_name")
                        elif "administrative_area_level_2" in types:
                            return component.get("long_name")
                        elif "administrative_area_level_1" in types:
                            return component.get("long_name")
            return "Unknown"

        except Exception:
            return "Unknown"
    
    def store_raw_data(self) -> Dict[str, Any]:
        """
        Tool 2: Store raw data in Firestore
        
        Returns:
            dict: Result of storage operation
        """
        if not self.raw_data:
            return {"error": "No raw data available to store. Please fetch data first."}
        
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.RAW_DATA_COLLECTION)
            stored_count = 0
            stored_docs = []
            errors = []
            
            for i, data_item in enumerate(self.raw_data):
                try:
                    storage_item = data_item.copy()
                    storage_item['stored_at'] = datetime.now()
                    
                    doc_ref = collection_ref.add(storage_item)
                    stored_docs.append(doc_ref[1].id)
                    stored_count += 1
                    
                except Exception as item_error:
                    error_msg = f"Error storing item {i}: {str(item_error)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            result = {
                "status": "success" if stored_count > 0 else "partial_failure",
                "stored_count": stored_count,
                "total_items": len(self.raw_data),
                "collection": FirestoreConfig.RAW_DATA_COLLECTION,
                "document_ids": stored_docs
            }
            
            if errors:
                result["errors"] = errors
            
            logger.info(f"Stored {stored_count} documents in Firestore collection '{FirestoreConfig.RAW_DATA_COLLECTION}'")
            return result
            
        except Exception as e:
            error_msg = f"Error storing raw data in Firestore: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    def analyze_raw_data(self) -> Dict[str, Any]:
        """
        Tool 3: Analyze raw data and categorize it
        
        Returns:
            dict: Result with analysis summary
        """
        if not self.raw_data:
            return {"error": "No raw data available to analyze. Please fetch data first."}
        
        try:
            self.processed_data = []
            
            for idx, data_item in enumerate(self.raw_data):
                try:
                    data = self._analyze_data_item(data_item, idx)
                    if data:
                        self.processed_data.append(data)
                        
                except Exception as item_error:
                    logger.error(f"Error analyzing item {idx}: {str(item_error)}")
                    continue
            
            return {
                "status": "success",
                "analyzed_count": len(self.processed_data),
                "total_items": len(self.raw_data),
                "message": f"Successfully analyzed {len(self.processed_data)} items"
            }
            
        except Exception as e:
            error_msg = f"Error analyzing raw data: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
        
    def get_resolution_time(self,categories: list[str]) -> datetime:
        """Returns the latest valid_upto from the matched categories."""
        durations = [
            CATEGORY_VALIDITY_DURATION.get(cat, timedelta(hours=1))  # default to 1hr
            for cat in categories
        ]
        return datetime.now() + max(durations, default=timedelta(hours=1))
    
    def _analyze_data_item(self, data_item: Dict[str, Any], idx: int) -> Optional[Dict[str, Any]]:
        """Analyze a single data item """
        if not isinstance(data_item, dict):
            return None
        
        text_content = DataProcessor.extract_text_content(data_item)
        location = DataProcessor.extract_location(data_item)
        coordinates = DataProcessor.normalize_coordinates(data_item)
        categories = DataProcessor.categorize_content(text_content)
        
        # Get combined advice for all categories
        advice = DataProcessor.get_combined_advice(categories)
        
        resolution_time = self.get_resolution_time(categories)
        
        return {
            "description": data_item.get("text", ""),
            "categories": categories,  # Now an array
            "advice": advice,
            "location": location,
            "coordinates": coordinates,
            "resolution_time": resolution_time,
            "source_id": data_item.get("id", f"unknown_{idx}"),
            "image_url": data_item.get("image_url"),
        }
    

    def store_processed_data(self) -> Dict[str, Any]:
        """
        Tool 4: Store processed data in Firestore

        Returns:
            dict: Result of storage operation
        """
        if not self.processed_data:
            return {"error": "No processed data available to store. Please analyze data first."}

        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.PROCESSED_DATA_COLLECTION)
            stored_count = 0
            updated_count = 0
            stored_docs = []
            errors = []

            for i, data in enumerate(self.processed_data):
                    try:
                        doc_ref = collection_ref.add(data)
                        stored_docs.append(doc_ref[1].id)
                        stored_count += 1
                    except Exception as insert_error:
                        error_msg = f"Error storing processed data {i}: {str(insert_error)}"
                        logger.error(error_msg)
                        errors.append(error_msg)

            result = {
                "status": "success" if stored_count > 0 or updated_count > 0 else "partial_failure",
                "stored_count": stored_count,
                "updated_count": updated_count,
                "total_processed_data": len(self.processed_data),
                "collection": FirestoreConfig.PROCESSED_DATA_COLLECTION,
                "document_ids": stored_docs
            }

            if errors:
                result["errors"] = errors

            logger.info(
                f"Stored {stored_count}, updated {updated_count} processed data in collection '{FirestoreConfig.PROCESSED_DATA_COLLECTION}'"
            )
            return result

        except Exception as e:
            error_msg = f"Error storing processed data in Firestore: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}


# Initialize the service
service = DataFusingService()

GEMINI_MODEL = "gemini-2.0-flash"  # Example model, replace with actual model if needed

# Create the Data Fusing Agent
data_fusing_agent = Agent(
    name="data_fusing_agent",
    model=GEMINI_MODEL,
    description="""
    This agent is responsible for data fusion from API endpoints to Firestore with analysis.
    
    Workflow for any city:
    1. Fetches live data from API endpoint 
    2. Stores raw data in predefined Firestore collection
    3. Analyzes and categorizes data (traffic/water-logging/events/stampede/emergency)
    4. Stores processed with advice in another Firestore collection
    
    Each summary includes: description, category, advice, location, coordinates
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_live_data to fetch data from API
    2. Call store_raw_data to save raw data to Firestore
    3. Call analyze_raw_data to categorize and analyze the data
    4. Call store_processed_data to save analyzed results with advice
    
    Handle errors gracefully and provide detailed feedback for each step.

    """,
    tools=[
        service.get_live_data,
        service.store_raw_data,
        service.analyze_raw_data,
        service.store_processed_data,
    ]
)