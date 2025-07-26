import os
import sys
import logging
import argparse
import uvicorn
import asyncio # Import asyncio
from contextlib import AsyncExitStack # For MCP exit stack
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Use relative imports within the agent package
from .task_manager import TaskManager # Add this import
from .agent import root_agent # Import the coroutine
from common.a2a_server import AgentRequest, AgentResponse, create_agent_server # Use the helper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

logging.disable(logging.CRITICAL)


# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_status = load_dotenv(dotenv_path=dotenv_path, override=True) # Use override just in case

# Global variable for the TaskManager instance
task_manager_instance: TaskManager | None = None

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Start the Nagar Chakshu Agent server")
    parser.add_argument(
        "--host", 
        type=str, 
        default=os.getenv("SPEAKER_HOST", "0.0.0.0"),
        help="Host to bind the server to"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=int(os.getenv("SPEAKER_PORT", "8003")),
        help="Port to bind the server to"
    )
    parser.add_argument(
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default=os.getenv("LOG_LEVEL", "info"),
        help="Set the logging level"
    )
    # Arguments related to TaskManager are handled via env vars now
    return parser.parse_args()

async def main(): # Make main async
    """Initialize and start the Speaker Agent server."""
    global task_manager_instance
    
    logger.info("Starting NagarChakshu Chatbot Agent A2A Server initialization...")
    
    # Await the root_agent coroutine to get the actual agent and exit_stack
    logger.info("Awaiting root_agent creation...")
    agent_instance= root_agent
    logger.info(f"Agent instance created: {agent_instance.name}")

    # Use the exit_stack to manage the MCP connection lifecycle
    if True:
        logger.info("MCP exit_stack entered.")
        # Initialize the TaskManager with the resolved agent instance
        task_manager_instance = TaskManager(agent=agent_instance)
        logger.info("TaskManager initialized with agent instance.")

        # Configuration for the A2A server
        # Use environment variables or defaults
        host = os.getenv("SPEAKER_A2A_HOST", "0.0.0.0")
        port = int(os.getenv("SPEAKER_A2A_PORT", 8004))
        
        # Create the FastAPI app using the helper
        # Pass the agent name, description, and the task manager instance
        app = create_agent_server(
            name=agent_instance.name,
            description=agent_instance.description,
            task_manager=task_manager_instance 
        )
        
        # Add CORS middleware to allow multiple origins
        # Development mode - allow all origins (set CORS_ALLOW_ALL=true in .env)
        allow_all_origins = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"
        
        if allow_all_origins:
            # Development mode - allow all origins
            app.add_middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_credentials=False,  # Must be False when allow_origins=["*"]
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["*"],
            )
        else:
            # Production mode - specific origins only
            allowed_origins = [
                "http://localhost:3000",  # Next.js development server
                "http://localhost:3001",  # Alternative frontend port
                "https://nagar-chakshu.vercel.app",  # Production domain
                "https://your-staging-domain.com",  # Staging domain
                # Add more origins as needed
            ]
            
            # Get additional origins from environment variable if provided
            env_origins = os.getenv("ALLOWED_ORIGINS", "")
            if env_origins:
                env_origins_list = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
                allowed_origins.extend(env_origins_list)
            
            app.add_middleware(
                CORSMiddleware,
                allow_origins=allowed_origins,
                allow_credentials=True,
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["*"],
            )
        
        print(f"NagarChakshu chatbot server starting on {host}:{port}")
        
        # Configure uvicorn
        config = uvicorn.Config(app, host=host, port=port, log_level="info")
        server = uvicorn.Server(config)
        
        # Run the server
        await server.serve()
        
        # This part will be reached after the server is stopped (e.g., Ctrl+C)
        logger.info("NagarChakshu Agent A2A server stopped.")

if __name__ == "__main__":
    try:
        # Run the async main function
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Chatbot server stopped by user.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error during server startup: {str(e)}", exc_info=True)
        sys.exit(1) 