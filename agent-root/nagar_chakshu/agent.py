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

from google.adk.agents import Agent

from .sub_agents.data_fusing_agent.agent import data_fusing_agent  # your sub-agent

root_agent = SequentialAgent(
    name="AgenticPipeline",
    description="A pipeline that fuses data, processes it, and generates insights.",
    sub_agents=[data_fusing_agent],
)
