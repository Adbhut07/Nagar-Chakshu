import os
import json
import inspect
from typing import Dict, Any, Callable, Optional

from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

class AgentRequest(BaseModel):
    """Standard A2A agent request format."""
    message: str = Field(..., description="The message to process")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context for the request")
    session_id: Optional[str] = Field(None, description="Session identifier for stateful interactions")

class AgentResponse(BaseModel):
    """Standard A2A agent response format."""
    data: Dict[str, Any] = Field(..., description="Response data containing message, status, and final response")

def create_agent_server(
    name: str, 
    description: str, 
    task_manager: Any, 
    endpoints: Optional[Dict[str, Callable]] = None,
    well_known_path: Optional[str] = None
) -> FastAPI:
    """
    Create a FastAPI server for an agent following A2A protocol.
    """
    app = FastAPI(title=f"{name} Agent", description=description)
    
    # Determine .well-known path
    if well_known_path is None:
        module_path = inspect.getmodule(inspect.stack()[1][0]).__file__
        well_known_path = os.path.join(os.path.dirname(module_path), ".well-known")
    
    os.makedirs(well_known_path, exist_ok=True)

    # Generate agent.json metadata
    agent_json_path = os.path.join(well_known_path, "agent.json")
    if not os.path.exists(agent_json_path):
        endpoint_names = ["run"]
        if endpoints:
            endpoint_names.extend(endpoints.keys())
        
        agent_metadata = {
            "name": name,
            "description": description,
            "endpoints": endpoint_names,
            "version": "1.0.0"
        }
        
        with open(agent_json_path, "w") as f:
            json.dump(agent_metadata, f, indent=2)

    # Standard /run A2A endpoint
    @app.post("/run", response_model=AgentResponse)
    async def run(request: AgentRequest = Body(...)):
        """Run the agent task."""
        try:
            result = await task_manager.process_task(request.message, request.context, request.session_id)
            return AgentResponse(
                data = {
                    "message": result.get("message", "Task processed successfully"),
                    "status": result.get("status", "success"),
                    "final_response": result.get("final_response", "")
                }
            )
        except Exception as e:
            return AgentResponse(
                data = {
                    "message": f"Error processing request: {str(e)}",
                    "status": "error",
                    "final_response": "None"
                }
            )

    # Serve agent metadata
    @app.get("/.well-known/agent.json")
    async def get_metadata():
        with open(agent_json_path, "r") as f:
            return JSONResponse(content=json.load(f))

    # Register custom endpoints if any
    if endpoints:
        for path, handler in endpoints.items():
            app.add_api_route(f"/{path}", handler, methods=["POST"])

    return app
