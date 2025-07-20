import logging
from typing import Dict, Any, Optional

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService, Session
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
from google.genai import types as adk_types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

A2A_APP_NAME = "nagar_chakshu_app"

class TaskManager:
    """Task Manager for the Reddit Scout App in A2A mode."""

    def __init__(self, agent: Agent):
        self.agent = agent

        # Initialize ADK services
        self.session_service = InMemorySessionService()
        self.artifact_service = InMemoryArtifactService()

        # Create the runner
        self.runner = Runner(
            agent=self.agent,
            app_name=A2A_APP_NAME,
            session_service=self.session_service,
            artifact_service=self.artifact_service
        )

    async def process_task(self, message: str, context: Dict[str, Any], session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an A2A task request by running the agent.

        Args:
            message: The text message to process.
            context: Additional context data.
            session_id: Optional session ID.

        Returns:
            Response dictionary.
        """
        # Use provided session ID or generate one
        session_id = session_id or "session-abc"
        user_id = context.get("user_id", "user-abc")

        try:
            session = await self.session_service.create_session(
            app_name=A2A_APP_NAME,
            user_id=user_id,
            state={"initial_key": "initial_value"} # State can be initialized
         )

            # Create user message content
            request_content = adk_types.Content(role="user", parts=[adk_types.Part(text=message)])

            # Run the agent asynchronously
            events_async = self.runner.run_async(
                user_id=user_id,
                session_id=session.id,
                new_message=request_content
            )

            raw_events = []
            async for event in events_async:
                raw_events.append(event.model_dump(exclude_none=True))
                
            # Final response
            final_raw_event = raw_events[len(raw_events) - 1] if raw_events else {}
            final_response = final_raw_event['content']['parts'][0]['text'] if 'content' in final_raw_event else "No response generated"

            return {
                "message": f"{len(raw_events)} events processed",
                "status": "success",
                "final_response": final_response,
            }

        except Exception as e:
            logger.exception("Failed to process task")
            return {
                "message": f"Error processing your request: {str(e)}",
                "status": "error",
                "data": {"error_type": type(e).__name__}
            }
