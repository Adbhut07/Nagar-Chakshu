
# import os
# import firebase_admin
# from firebase_admin import credentials, firestore
# from google.cloud.firestore_v1 import GeoPoint
# from datetime import datetime
# from google.adk.agents import Agent  # Ensure ADK is installed

# # Firestore client setup
# firestore_client = firestore.Client()

# # Initialize Firebase Admin
# cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
# if not firebase_admin._apps:
#     cred = credentials.Certificate(cred_path)
#     firebase_admin.initialize_app(cred)

# # Firestore client
# db = firestore.client()


# from google.cloud.firestore_v1 import GeoPoint
# from google.protobuf.timestamp_pb2 import Timestamp as ProtoTimestamp
# from datetime import datetime

# def serialize_firestore_value(value):
#     if isinstance(value, GeoPoint):
#         return {"lat": value.latitude, "lng": value.longitude}
#     elif isinstance(value, datetime):  # Firestore Timestamps are `datetime` objects
#         return value.isoformat()
#     elif isinstance(value, dict):
#         return {k: serialize_firestore_value(v) for k, v in value.items()}
#     elif isinstance(value, list):
#         return [serialize_firestore_value(v) for v in value]
#     else:
#         return value


# def read_real_time_data():
#     try:
#         collection_ref = db.collection("realtime-data")
#         docs = collection_ref.stream()

#         result = []
#         for doc in docs:
#             data = doc.to_dict()
#             data["id"] = doc.id
#             serialized = serialize_firestore_value(data)
#             result.append(serialized)
        
#         print(f"Fetched {len(result)} documents from Firestore.")
#         print(result)
#         return result

#     except Exception as e:
#         return f"Error reading Firestore: {e}"

# data_fusing_agent = Agent(
#     name="data_fusing_agent",
#     model="gemini-2.0-flash",
#     description="""
#     This agent reads real-time data from Firestore and processes it.
#     It can be used to fuse data from multiple sources.
#     """,
#     instruction="Call the available tool to read real data",
#     tools=[read_real_time_data]
# )

import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import GeoPoint
from datetime import datetime
import requests
from google.adk.agents import Agent
import json
import logging
import requests
import httpx

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
BASE_API_URL = os.getenv("BASE_API_URL", "https://your-api-domain.com")

# Initialize Firebase Admin (only once)
try:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not firebase_admin._apps:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Use default credentials if no explicit path provided
            firebase_admin.initialize_app()
    
    # Firestore client
    db = firestore.client()
    
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")
    raise

# Global variables to store data between agent calls
raw_data = []
collection_name_raw_data = "raw_data"
collection_name_processed_data = "processed_data"
summaries = []

def serialize_firestore_value(value):
    """Serialize Firestore values for JSON compatibility"""
    if isinstance(value, GeoPoint):
        return {"lat": value.latitude, "lng": value.longitude}
    elif isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, dict):
        return {k: serialize_firestore_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [serialize_firestore_value(v) for v in value]
    else:
        return value

async def get_live_data():
    """
    Tool 1: Get live data from API endpoint 

    Returns:
        dict: Result with data or error information
    """
    global raw_data
    
    api_endpoint = f"{BASE_API_URL}/api/twitter-feed"
    city_name="bangalore"
    
    try:
        logger.info(f"Fetching data from API endpoint: {api_endpoint} for city: {city_name}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(api_endpoint, timeout=30)
        
        # Handle response
        if response.status_code == 200:
            api_response = response.json()
            data = api_response.get('data', api_response)

            # Normalize data structure
            if isinstance(data, dict):
                data = [data]
            elif not isinstance(data, list):
                data = [data] if data is not None else []

            processed_data = []
            for item in data:
                if isinstance(item, dict):
                    processed_item = item.copy()
                    processed_item.update({
                        'fetched_at': datetime.now().isoformat(),
                        'source_city': city_name,
                        'api_endpoint': api_endpoint
                    })

                    # Normalize coordinates
                    coords = processed_item.get('coordinates')
                    if isinstance(coords, list) and len(coords) >= 2:
                        processed_item['coordinates'] = {
                            "lat": float(coords[0]),
                            "lng": float(coords[1])
                        }

                    processed_data.append(processed_item)
                else:
                    processed_data.append({
                        'data': item,
                        'fetched_at': datetime.now().isoformat(),
                        'source_city': city_name,
                        'api_endpoint': api_endpoint
                    })

            raw_data = processed_data

            logger.info(f"Fetched {len(processed_data)} items for city: {city_name}")
            print(f"Fetched data: {processed_data}")
            return {
                "status": "success",
                "data_count": len(processed_data),
                "city": city_name,
                "message": f"Fetched {len(processed_data)} items"
            }

        else:
            error_msg = f"API request failed with status {response.status_code}: {response.text}"
            logger.error(error_msg)
            return {"error": error_msg, "status_code": response.status_code}

    except requests.exceptions.Timeout:
        error_msg = f"Request timed out for city: {city_name}"
        logger.error(error_msg)
        return {"error": error_msg}

    except requests.exceptions.ConnectionError:
        error_msg = f"Connection error for city: {city_name}"
        logger.error(error_msg)
        return {"error": error_msg}

    except Exception as e:
        error_msg = f"Unhandled error for city {city_name}: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}
    
    
def store_raw_data():
    """
    Tool 2: Store raw data in Firestore
    
    Returns:
        dict: Result of storage operation
    """
    global raw_data
    
    try:
        if not raw_data:
            return {"error": "No raw data available to store. Please fetch data first."}
        
        collection_ref = db.collection(collection_name_raw_data)
        stored_count = 0
        stored_docs = []
        errors = []
        
        for i, data_item in enumerate(raw_data):
            try:
                # Add timestamp for when data was stored
                storage_item = data_item.copy()
                storage_item['stored_at'] = datetime.now()
                
                # Store in Firestore
                doc_ref = collection_ref.add(storage_item)
                stored_docs.append(doc_ref[1].id)  # Store document ID
                stored_count += 1
                
            except Exception as item_error:
                error_msg = f"Error storing item {i}: {str(item_error)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        result = {
            "status": "success" if stored_count > 0 else "partial_failure",
            "stored_count": stored_count,
            "total_items": len(raw_data),
            "collection": collection_name_raw_data,
            "document_ids": stored_docs
        }
        
        if errors:
            result["errors"] = errors
        
        logger.info(f"Stored {stored_count} documents in Firestore collection '{collection_name_raw_data}'")
        return result
    
    except Exception as e:
        error_msg = f"Error storing raw data in Firestore: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}

def analyze_raw_data():
    """
    Tool 3: Analyze raw data and categorize it
    
    Returns:
        dict: Result with analysis summary
    """
    global raw_data, summaries
    
    try:
        if not raw_data:
            return {"error": "No raw data available to analyze. Please fetch data first."}
        
        summaries = []
        
        # Enhanced keywords for better categorization
        category_keywords = {
            "traffic": ["traffic", "jam", "congestion", "vehicle", "road", "highway", "blocked", "slow", "delay", "gridlock", "commuter", "pothole", "repair"],
            "water-logging": ["flood", "water", "rain", "drainage", "waterlogged", "overflow", "inundated", "submerged", "sewage", "drain", "flooding"],
            "events": ["event", "festival", "concert", "gathering", "celebration", "parade", "rally", "protest", "march", "jogging", "group", "crowding"],
            "stampede": ["crowd", "stampede", "rush", "panic", "overcrowded", "pushing", "crush", "mob"],
            "emergency": ["emergency", "accident", "fire", "medical", "ambulance", "police", "rescue", "disaster"],
            "infrastructure": ["pothole", "repair", "maintenance", "construction", "road work", "sidewalk", "footpath"]
        }
        
        # Advice mapping for each category
        advice_map = {
            "traffic": "Road conditions may cause delays. Consider alternative routes or allow extra travel time. Check for ongoing repairs.",
            "water-logging": "Avoid the area completely. Roads may be unsafe for vehicles. Risk of vehicle damage or getting stranded.",
            "events": "Expect minor delays and increased foot traffic. Cycling lanes may still be accessible. Plan accordingly.",
            "stampede": "URGENT: Avoid the area immediately. Seek alternative routes and stay safe. Emergency situation.",
            "emergency": "Emergency services are active in the area. Avoid if possible and follow official instructions.",
            "infrastructure": "Infrastructure issues reported. Exercise caution when traveling through this area. Repairs may be needed.",
            "other": "Monitor the situation closely and stay alert. Follow local advisories and exercise caution."
        }
        
        for idx, data_item in enumerate(raw_data):
            try:
                # Extract text content for analysis
                text_content = ""
                if isinstance(data_item, dict):
                    # Primary text content from 'text' field
                    if 'text' in data_item and data_item['text']:
                        text_content = str(data_item['text'])
                    
                    # Also include other relevant fields if present
                    additional_fields = ['description', 'message', 'content', 'details', 'info', 'title', 'summary']
                    for field in additional_fields:
                        if field in data_item and data_item[field]:
                            text_content += f" {str(data_item[field])}"
                    
                    # If no text content found, use other string fields
                    if not text_content.strip():
                        text_content = " ".join([
                            str(value) for key, value in data_item.items() 
                            if isinstance(value, (str, int, float)) and key not in ['id', 'edit_history_tweet_ids', 'image_url', 'coordinates', 'fetched_at', 'api_endpoint']
                        ])
                
                text_content = text_content.lower() if text_content else ""
                
                # Categorize based on keywords
                category = "other"
                max_matches = 0
                confidence_score = 0
                
                for cat, keywords in category_keywords.items():
                    matches = sum(1 for keyword in keywords if keyword in text_content)
                    if matches > max_matches:
                        max_matches = matches
                        category = cat
                        confidence_score = matches / len(keywords)
                
                # Extract location information
                location = "Unknown"
                if isinstance(data_item, dict):
                    location_fields = ['location', 'address', 'place', 'source_city']
                    for field in location_fields:
                        if field in data_item and data_item[field]:
                            location = str(data_item[field])
                            break
                
                # Extract coordinates
                coordinates = None
                if isinstance(data_item, dict) and 'coordinates' in data_item:
                    if isinstance(data_item['coordinates'], dict):
                        coordinates = data_item['coordinates']
                    elif isinstance(data_item['coordinates'], list) and len(data_item['coordinates']) >= 2:
                        coordinates = {
                            "lat": float(data_item['coordinates'][0]),
                            "lng": float(data_item['coordinates'][1])
                        }
                elif isinstance(data_item, dict):
                    # Check for other coordinate formats
                    if 'latitude' in data_item and 'longitude' in data_item:
                        coordinates = {
                            "lat": float(data_item['latitude']),
                            "lng": float(data_item['longitude'])
                        }
                    elif 'lat' in data_item and 'lng' in data_item:
                        coordinates = {
                            "lat": float(data_item['lat']),
                            "lng": float(data_item['lng'])
                        }
                
                # Generate description
                if max_matches > 0:
                    description = f"Detected {category} situation in {location}: {text_content[:150]}..."
                else:
                    description = f"Situation reported in {location}: {text_content[:150]}..."
                
                # Ensure description is not too long
                if len(description) > 200:
                    description = description[:197] + "..."
                
                # Create summary object
                summary = {
                    "description": description,
                    "category": category,
                    "advice": advice_map.get(category, advice_map["other"]),
                    "location": location,
                    "coordinates": coordinates,
                    "analyzed_at": datetime.now(),
                    "confidence_score": round(confidence_score, 2),
                    "keyword_matches": max_matches,
                    "source_id": data_item.get("id", f"unknown_{idx}") if isinstance(data_item, dict) else f"item_{idx}",
                    "source_city": data_item.get("source_city", location) if isinstance(data_item, dict) else location,
                    "image_url": data_item.get("image_url") if isinstance(data_item, dict) else None
                }
                
                summaries.append(summary)
                
            except Exception as item_error:
                logger.error(f"Error analyzing item {idx}: {str(item_error)}")
                continue
        
        # Sort by confidence score (highest first)
        summaries.sort(key=lambda x: x.get('confidence_score', 0), reverse=True)
        
        logger.info(f"Analyzed {len(raw_data)} items and generated {len(summaries)} summaries")
        
        return {
            "status": "success",
            "analyzed_count": len(summaries),
            "total_items": len(raw_data),
            "categories": {cat: len([s for s in summaries if s['category'] == cat]) for cat in category_keywords.keys()},
            "message": f"Successfully analyzed {len(summaries)} items"
        }
    
    except Exception as e:
        error_msg = f"Error analyzing raw data: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}

def store_summary():
    """
    Tool 4: Store analyzed summaries in Firestore
    
    Returns:
        dict: Result of storage operation
    """
    global summaries
    
    try:
        if not summaries:
            return {"error": "No summaries available to store. Please analyze data first."}
        
        collection_ref = db.collection(collection_name_processed_data)
        stored_count = 0
        stored_docs = []
        errors = []
        
        for i, summary in enumerate(summaries):
            try:
                # Create a copy to avoid modifying original
                storage_summary = summary.copy()
                
                # Convert coordinates to GeoPoint if available
                if storage_summary.get("coordinates") and isinstance(storage_summary["coordinates"], dict):
                    lat = storage_summary["coordinates"].get("lat")
                    lng = storage_summary["coordinates"].get("lng")
                    if lat is not None and lng is not None:
                        try:
                            storage_summary["coordinates"] = GeoPoint(float(lat), float(lng))
                        except (ValueError, TypeError) as coord_error:
                            logger.warning(f"Invalid coordinates for item {i}: {lat}, {lng} - {coord_error}")
                            storage_summary["coordinates"] = None
                
                # Store in Firestore
                doc_ref = collection_ref.add(storage_summary)
                stored_docs.append(doc_ref[1].id)
                stored_count += 1
                
            except Exception as item_error:
                error_msg = f"Error storing summary {i}: {str(item_error)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        result = {
            "status": "success" if stored_count > 0 else "partial_failure",
            "stored_count": stored_count,
            "total_summaries": len(summaries),
            "collection": collection_name_processed_data,
            "document_ids": stored_docs
        }
        
        if errors:
            result["errors"] = errors
        
        logger.info(f"Stored {stored_count} summaries in Firestore collection '{collection_name_processed_data}'")
        return result
    
    except Exception as e:
        error_msg = f"Error storing summaries in Firestore: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}

# Create the Data Fusing Agent
data_fusing_agent = Agent(
    name="data_fusing_agent",
    model="gemini-2.0-flash",
    description="""
    This agent is responsible for data fusion from API endpoints to Firestore with analysis.
    
    Workflow for any city:
    1. Fetches live data from API endpoint 
    2. Stores raw data in predefined Firestore collection
    3. Analyzes and categorizes data (traffic/water-logging/events/stampede/emergency)
    4. Stores analyzed summaries with advice in another Firestore collection
    
    Each summary includes: description, category, advice, location, coordinates
    """,
    instruction="""
    Execute the complete data fusion workflow:
    
    1. Call get_live_data to fetch data from API
    2. Call store_raw_data to save raw data to Firestore
    3. Call analyze_raw_data to categorize and analyze the data
    4. Call store_summary to save analyzed results with advice
    
    Handle errors gracefully and provide detailed feedback for each step.
    """,
    tools=[
        get_live_data,
        store_raw_data, 
        analyze_raw_data,
        store_summary,
    ]
)