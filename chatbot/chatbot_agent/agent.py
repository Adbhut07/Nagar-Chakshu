import random
import os
from google.adk.agents import Agent
import random
import praw
from praw.exceptions import PRAWException
import dotenv
from dotenv import load_dotenv
import re
from datetime import datetime
from collections import defaultdict
import aiohttp
import asyncio

load_dotenv()

async def fetch_details(message: str):
    """
    Fetch city details from the API based on user message
    
    Args:
        message (str): User's query or message to search for relevant city information
    
    Returns:
        dict: API response containing city information
    """
    try:
        endpoint = os.getenv('BASE_API_URL') + "/api/ai-search"
        body = {
            "message": message
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, json=body) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {
                        "error": f"API request failed with status {response.status}",
                        "message": "Unable to fetch city information at this time"
                    }
    
    except Exception as e:
        return {
            "error": str(e),
            "message": "An error occurred while fetching city information"
        }

root_agent = Agent(
    name="city_events_chatbot",
    model="gemini-2.0-flash",
    description="A professional city information assistant that provides real-time updates on local events, incidents, and city services.",
    instruction="""
    You are a professional city information assistant designed to help users stay informed about local events and city services.
    
    PRIMARY RESPONSIBILITIES:
    - Engage in natural, helpful conversations with users about city-related topics
    - Provide accurate information about local events, incidents, traffic conditions, and city services
    - Maintain a professional, courteous, and informative tone in all interactions
    
    WHEN TO USE TOOLS:
    When users inquire about specific city-related information including:
    - Current incidents or emergencies
    - Traffic conditions and road closures  
    - Water logging or flooding reports
    - Public events and activities
    - City service disruptions
    - Local news and updates
    
    TOOL USAGE PROTOCOL:
    1. For any specific city-related query, use the fetch_details() tool with the user's message as parameter
    2. Pass the user's original query or relevant keywords to the fetch_details function
    3. Present the retrieved information clearly and concisely to the user
    4. Ensure the response directly addresses the user's question
    5. If the API returns an error, inform the user professionally and suggest trying again later
    
    COMMUNICATION GUIDELINES:
    - Be concise and direct while remaining friendly
    - Provide actionable information when possible
    - If information is unavailable, clearly state this and suggest alternatives
    - Always prioritize accuracy and timeliness of information
    - Handle API errors gracefully and maintain professional tone
    
    EXAMPLE USAGE:
    - User asks: "What's the traffic situation on Main Street?"
    - You should call: fetch_details("traffic situation Main Street")
    - Then provide a clear summary of the API response
    """,
    tools=[fetch_details]
)