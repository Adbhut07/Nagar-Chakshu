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
import mimetypes
import tempfile
import cv2
from PIL import Image
from io import BytesIO
from ..util import KEYWORDS, CATEGORY_VALIDITY_DURATION

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
    USER_REPORTS_COLLECTION = "user_reports"
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




class MultiModalIntakeService:
    """Main service class for data fusing operations"""
    
    def __init__(self):
        self.firebase_manager = FirebaseManager()
        self.user_reports: List[Dict[str, Any]] = []
        self.processed_data: List[Dict[str, Any]] = []
        
    async def get_submitted_reports(self) -> List[Dict[str, Any]]:
        """Fetch user submitted reports from Firestore"""
        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.USER_REPORTS_COLLECTION)
            docs = collection_ref.stream()
            self.user_reports = [doc.to_dict() for doc in docs]
            print('Fetched', len(self.user_reports), 'user reports')
            return self.user_reports
        except Exception as e:
            logger.error(f"Error fetching user reports: {e}")
            return []
        
    def download_media(self, url):
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch media: {url}")
                
        content_type = response.headers.get("Content-Type") or mimetypes.guess_type(url)[0]
        return response.content, content_type

    def analyze_image_bytes(self, image_bytes, prompt):
        image = Image.open(BytesIO(image_bytes))
        response = model.generate_content([prompt, image])
        return self._parse_yes_no_response(response.text)

    def analyze_video_bytes(self, video_bytes, prompt):
        max_frames = 5  # Limit to 5 frames for analysis
        with tempfile.NamedTemporaryFile(suffix=".mp4") as temp_video:
            temp_video.write(video_bytes)
            temp_video.flush()
            
            cap = cv2.VideoCapture(temp_video.name)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            yes_count = 0
            total_frames = 0
            
            for i in range(max_frames):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count * i // max_frames)
                ret, frame = cap.read()
                            
                if ret:
                    _, buffer = cv2.imencode('.jpg', frame)
                    image = Image.open(BytesIO(buffer.tobytes()))
                    response = model.generate_content([prompt, image])
                    
                    if self._parse_yes_no_response(response.text):
                        yes_count += 1
                    total_frames += 1
            
            cap.release()
            # Return True if majority of frames match the description
            return yes_count > (total_frames / 2) if total_frames > 0 else False

    def _parse_yes_no_response(self, response_text):
        """Parse AI response to extract yes/no and convert to boolean"""
        response_lower = response_text.lower().strip()
        
        # Check for explicit yes/no
        if 'yes' in response_lower and 'no' not in response_lower:
            return True
        elif 'no' in response_lower and 'yes' not in response_lower:
            return False
        
        # Fallback: look for positive/negative indicators
        positive_indicators = ['true', 'correct', 'match', 'shows', 'contains', 'displays']
        negative_indicators = ['false', 'incorrect', 'no match', 'does not', 'doesn\'t']
        
        for indicator in positive_indicators:
            if indicator in response_lower:
                return True
        
        for indicator in negative_indicators:
            if indicator in response_lower:
                return False
        
        # Default to False if unclear
        return False

    def analyze_media(self, media_url: str, description: str) -> bool:
        """Analyze media and return True/False based on whether it matches description"""
        prompt = f"Does this media show: '{description}'? Answer with 'yes' if it matches or 'no' if it doesn't."
        
        try:
            media_bytes, content_type = self.download_media(media_url)
            
            if content_type.startswith("image"):
                return self.analyze_image_bytes(media_bytes, prompt)
                        
            elif content_type.startswith("video"):
                return self.analyze_video_bytes(media_bytes, prompt)
                        
            else:
                raise ValueError(f"Unsupported media type: {content_type}")
                
        except Exception as e:
            print(f"Error analyzing media {media_url}: {e}")
            return False
        
        
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
        
    def categorize_content(self, description: str, score_output: bool = False) -> List[str] | List[Tuple[str, int]]:
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
    
    def get_combined_advice(self, categories: List[str]) -> str:
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
    
    
    
    def get_resolution_time(self,categories: list[str]) -> datetime:
        """Returns the latest valid_upto from the matched categories."""
        durations = [
            CATEGORY_VALIDITY_DURATION.get(cat, timedelta(hours=1))  # default to 1hr
            for cat in categories
        ]
        return datetime.now() + max(durations, default=timedelta(hours=1))
    
    
    def _analyze_data_item(self, data_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            """Analyze a single data item and create summary"""
            

            
            if not isinstance(data_item, dict):
                return None
            
            text_content = data_item.get("description", "")
            location = self._get_city_from_coordinates(data_item.get("location", {}))
            coordinates = {
                'lat': data_item.get("location", {}).get("latitude"),
                'lng': data_item.get("location", {}).get("longitude")
            }
            categories = self.categorize_content(text_content)
            
            # Get combined advice for all categories
            advice = self.get_combined_advice(categories)
            
            resolution_time = self.get_resolution_time(categories)
            
            
            
            return {
                "description": data_item.get("description", ""),
                "categories": categories,  # Now an array
                "advice": advice,
                "location": location,
                "coordinates": coordinates,
                "resolution_time": resolution_time,
                "source_id": data_item.get("id", f"unknown_id_{random.randint(1000, 9999)}"),
                "source_city": data_item.get("source_city", location),
                "image_url": data_item.get("mediaUrl", ""),
            }

    def process_reports(self) -> List[Dict[str, Any]]:
        """Process user reports to categorize and analyze them"""
        for report in self.user_reports:
            try:
                
                is_matching = self.analyze_media(report["mediaUrl"], report["description"])
             
                if (is_matching):
                    summary = self._analyze_data_item(report)
                    if summary:
                        self.processed_data.append(summary)
                    else:
                        continue
                    
            except Exception as e:
                logger.error(f"Error processing report {report.get('id', 'unknown')}: {e}")
                continue
        print(f"Processed {len(self.processed_data)} reports successfully.")

            
        return self.processed_data
    
    def store_processed_data(self) -> Dict[str, Any]:
        """
        Tool 3: Store analyzed processed_data in Firestore

        Returns:
            dict: Result of storage operation
        """
        if not self.processed_data:
            return {"error": "No processed_data available to store. Please analyze data first."}

        try:
            collection_ref = self.firebase_manager.db.collection(FirestoreConfig.PROCESSED_DATA_COLLECTION)
            stored_count = 0
            updated_count = 0
            stored_docs = []
            errors = []



            for i, summary in enumerate(self.processed_data):
                    try:
                        doc_ref = collection_ref.add(summary)
                        stored_docs.append(doc_ref[1].id)
                        stored_count += 1
                    except Exception as insert_error:
                        error_msg = f"Error storing summary {i}: {str(insert_error)}"
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
                f"Stored {stored_count}, updated {updated_count} processed_data in collection '{FirestoreConfig.PROCESSED_DATA_COLLECTION}'"
            )
            return result

        except Exception as e:
            error_msg = f"Error storing processed_data in Firestore: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
        
        


# Initialize the service
service = MultiModalIntakeService()

GEMINI_MODEL = "gemini-2.0-flash"  # Example model, replace with actual model if needed

# Create the Data Fusing Agent
multimodal_intake_agent = Agent(
    name="multimodal_intake_agent",
    model=GEMINI_MODEL,
    description="""
    This agent is responsible for fusing multimodal data (user submitted reports) from a firebase database collection.
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_submitted_reports to fetch reports from an API.
    2. Call process_reports to categorize and analyze the reports (with image or video) using gemini vision capabilities, Extract needed information and store it as summary.
    4. Call store_processed_data to save analyzed results with advice.
    
    Handle errors gracefully and provide detailed feedback for each step.

    """,
    tools=[
        service.get_submitted_reports,
        service.process_reports,
        service.store_processed_data
    ]
)