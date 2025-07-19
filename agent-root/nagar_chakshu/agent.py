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

load_dotenv()

from google.adk.agents import Agent

from .sub_agents.data_fusing_agent.agent import data_fusing_agent  # your sub-agent

root_agent = Agent(
    name="nagar_chakshu",
    model="gemini-2.0-flash",
    description="Manager agent",
    instruction="""
    You are a manager agent that is responsible for overseeing the work of the other agents.

    Always delegate the task to the appropriate agent. Use your best judgement 
    to determine which agent to delegate to.
    
    Currently only one sub-agent is available, which is the data_fusing_agent.
    In any case, you should always delegate the task to the data_fusing_agent.
    """,
    sub_agents=[data_fusing_agent],

)
