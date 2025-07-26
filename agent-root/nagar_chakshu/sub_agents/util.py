import math
from datetime import datetime, timedelta
from math import log10

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
        "marriage", "public meeting", "conference", "seminar", "cultural event", "exhibition, hackathon, hackathons"
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

__base32 = '0123456789bcdefghjkmnpqrstuvwxyz'

def encode(latitude, longitude, precision=12):
    """
    Encode a position given in float arguments latitude, longitude to
    a geohash which will have the character count precision.
    """
    lat_interval, lon_interval = (-90.0, 90.0), (-180.0, 180.0)
    geohash = []
    bits = [ 16, 8, 4, 2, 1 ]
    bit = 0
    ch = 0
    even = True
    while len(geohash) < precision:
        if even:
            mid = (lon_interval[0] + lon_interval[1]) / 2
            if longitude > mid:
                ch |= bits[bit]
                lon_interval = (mid, lon_interval[1])
            else:
                lon_interval = (lon_interval[0], mid)
        else:
            mid = (lat_interval[0] + lat_interval[1]) / 2
            if latitude > mid:
                ch |= bits[bit]
                lat_interval = (mid, lat_interval[1])
            else:
                lat_interval = (lat_interval[0], mid)
        even = not even
        if bit < 4:
            bit += 1
        else:
            geohash += __base32[ch]
            bit = 0
            ch = 0
    return ''.join(geohash)



COMMON_SENTIMENTS = [
    # Positive
    "Happy", "Excited", "Hopeful", "Grateful", "Proud",

    # Neutral
    "Calm", "Indifferent", "Uncertain", "Waiting",

    # Negative
    "Frustrated", "Angry", "Worried", "Disappointed", "Helpless"
]



PROMPT_SENTIMENT_ANALYSIS = """
You are an exper in sentiment analysis. Your task is to analyze the sentiment of the provided combined descriptions text.
You have to just return the sentiment of the text in one word. You have to decide 
the sentiment from the following list of common sentiments:



"""+"\n".join(COMMON_SENTIMENTS)+"Combined Description:\n"

PROMPT_PREDICTIVE_ANALYSIS = """

You are an expert in predictive analysis. Your task is to analyze the summary and make predictions based on it.
You have to return the prediction in 2-3 lines. It should be crisp and to the point.

Summary:\n
"""

