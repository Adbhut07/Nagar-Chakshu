import random
import os
from google.adk.agents import SequentialAgent
import random
import praw
from praw.exceptions import PRAWException
import dotenv
from dotenv import load_dotenv
import re
from datetime import datetime
from collections import defaultdict

load_dotenv()

from .sub_agents.data_fusing_agent.agent import data_fusing_agent
from .sub_agents.multimodal_intake_agent.agent import multimodal_intake_agent
from .sub_agents.synthesis_agent.agent import synthesis_agent
from .sub_agents.sentiment_analyzer_agent.agent import sentiment_analyzer_agent
from .sub_agents.predictive_agent.agent import predictive_agent

root_agent = SequentialAgent(
    name="AgenticPipeline",
    description="A pipeline that fuses data, processes it, and generates insights.",
    sub_agents=[data_fusing_agent, multimodal_intake_agent,synthesis_agent, sentiment_analyzer_agent,predictive_agent],
)