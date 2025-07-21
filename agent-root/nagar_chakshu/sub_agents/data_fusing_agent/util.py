import math
from datetime import datetime, timedelta

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Returns distance in meters between two lat/lon points using the Haversine formula.
    """
    R = 6371000  # Earth radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c  # in meters

def is_within_radius(lat1, lon1, lat2, lon2, radius_meters):
    """
    Returns True if the two points are within the given radius (in meters).
    """
    distance = haversine_distance(lat1, lon1, lat2, lon2)
    return distance <= radius_meters

KEYWORDS = {
    "traffic": [
        "traffic", "jam", "jams", "congestion", "vehicle", "vehicles", "car", "cars", "truck", "trucks",
        "road", "roads", "highway", "blocked", "blockage", "slow", "delayed", "delay", "gridlock",
        "commuter", "commuters", "accident", "pothole", "repair", "signal", "signals", "intersection",
        "parking", "no parking", "lane", "diversion", "detour", "bottleneck", "overbridge", "underbridge"
    ],
    "water-logging": [
        "flood", "flooded", "water", "rain", "raining", "drainage", "waterlogged", "overflow", "inundated",
        "submerged", "sewage", "clogged drain", "drain", "flooding", "puddle", "puddles", "monsoon",
        "storm water", "underpass", "underpasses", "overflowing", "choked drain", "backflow", "manhole"
    ],
    "events": [
        "event", "events", "festival", "festivals", "concert", "concerts", "gathering", "gatherings",
        "celebration", "celebrations", "parade", "parades", "rally", "rallies", "protest", "protests",
        "march", "marches", "jogging group", "marathon", "crowding", "crowd", "ceremony", "wedding",
        "marriage", "public meeting", "conference", "seminar", "cultural event", "exhibition"
    ],
    "stampede": [
        "crowd", "stampede", "rush", "panic", "overcrowded", "pushing", "crush", "mob", "trampled",
        "chaos", "crowding", "people running", "mass gathering", "crowd collapse"
    ],
    "emergency": [
        "emergency", "accident", "accidents", "fire", "medical", "ambulance", "injury", "injured",
        "police", "rescue", "disaster", "urgent", "crisis", "help", "call for help", "burning",
        "explosion", "evacuation", "emergency services", "first aid", "911", "helpline"
    ],
    "infrastructure": [
        "pothole", "potholes", "repair", "maintenance", "construction", "road work", "digging", "sidewalk",
        "footpath", "bridge", "bridges", "tunnel", "tunnels", "street light", "street lights",
        "signage", "sign board", "barricade", "barrier", "broken road", "collapsed", "incomplete work"
    ],
    "weather": [
        "weather", "storm", "storms", "wind", "winds", "hail", "fog", "foggy", "visibility", "low visibility",
        "thunder", "lightning", "cyclone", "heat wave", "cold wave", "cloudburst", "rainfall", "heavy rain",
        "drizzle", "temperature", "humid", "humidity"
    ],
    "public-transport": [
        "bus", "buses", "metro", "train", "trains", "auto", "autos", "rickshaw", "rickshaws", "taxi",
        "taxis", "cab", "cabs", "transport", "route", "routes", "schedule", "delayed", "breakdown",
        "public transport", "overcrowded", "cancelled", "no service", "halted", "track fault"
    ],
    "civic-issues": [
        "garbage", "trash", "litter", "waste", "cleanliness", "pollution", "air pollution", "noise",
        "noise pollution", "stray", "dogs", "cows", "animals", "monkey menace", "street vendor",
        "hawker", "encroachment", "open defecation", "urinating", "dirty", "smell", "stench", "sanitation"
    ],
    "security": [
        "theft", "robbery", "crime", "suspicious", "suspicious activity", "security", "unsafe",
        "safety", "harassment", "assault", "violence", "fight", "quarrel", "snatching", "chain snatching",
        "stalking", "molestation", "sexual harassment", "breaking in", "vandalism"
    ],
    "utility": [
        "power", "power cut", "electricity", "load shedding", "blackout", "no electricity", "water supply",
        "no water", "low pressure", "gas", "leak", "internet", "wifi", "disconnected", "outage",
        "cut", "disruption", "mobile signal", "cable", "telephone", "landline", "no network", "connectivity issue"
    ]
}


CATEGORY_VALIDITY_DURATION = {
    "traffic": timedelta(hours=2),
    "water-logging": timedelta(hours=6),
    "events": timedelta(hours=6),
    "stampede": timedelta(days=2),
    "emergency": timedelta(days=2),
    "infrastructure": timedelta(days=3),
    "weather": timedelta(hours=12),
    "public-transport": timedelta(hours=4),
    "civic-issues": timedelta(days=2),
    "security": timedelta(days=2),
    "utility": timedelta(hours=8),
}





