#!/usr/bin/env python3
"""
FastAPI server for the expungement agent frontend.
Provides endpoints to get chat history and session data.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import sys
import os
import jwt
import time
from datetime import datetime, timedelta

# Add src directory to path to import parser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.parser import ConversationParser

app = FastAPI(title="Expungement Agent API")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_DIR = Path("/tmp/livekit_session")

# Get LiveKit credentials from environment
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")


@app.post("/api/token")
async def create_token():
    """Generate a LiveKit token for frontend to connect"""
    if not LIVEKIT_URL or not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
    
    # Generate a unique room name
    room_name = f"room_{int(time.time())}"
    participant_name = "user"
    
    # Create LiveKit token
    token = jwt.encode(
        {
            "iss": LIVEKIT_API_KEY,
            "sub": participant_name,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,  # 1 hour expiration
            "video": {"room": room_name, "roomJoin": True},
            "audio": {"room": room_name, "roomJoin": True},
        },
        LIVEKIT_API_SECRET,
        algorithm="HS256"
    )
    
    return {
        "url": LIVEKIT_URL,
        "token": token,
        "room": room_name
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "session_dir": str(SESSION_DIR)}


@app.get("/api/sessions")
async def get_sessions():
    """Get list of all sessions"""
    sessions = []
    for json_file in sorted(SESSION_DIR.glob("session_*.json"), reverse=True):
        if "_qa.json" not in json_file.name:  # Skip parsed files
            sessions.append({
                "filename": json_file.name,
                "path": str(json_file),
                "size": json_file.stat().st_size
            })
    return {"sessions": sessions}


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get full session data (with turns)"""
    session_file = SESSION_DIR / session_id
    if not session_file.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        with open(session_file, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}/qa")
async def get_session_qa(session_id: str):
    """Get parsed Q&A JSON for a session"""
    session_file = SESSION_DIR / session_id
    if not session_file.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        parser = ConversationParser(str(session_file))
        qa_data = parser.create_formatted_json()
        return qa_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/latest")
async def get_latest_session():
    """Get the most recent session"""
    sessions = sorted(SESSION_DIR.glob("session_*.json"), reverse=True)
    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found")
    
    latest_session = sessions[0]
    try:
        with open(latest_session, 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/latest/qa")
async def get_latest_qa():
    """Get parsed Q&A for the most recent session"""
    sessions = sorted(SESSION_DIR.glob("session_*.json"), reverse=True)
    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found")
    
    latest_session = sessions[0]
    try:
        parser = ConversationParser(str(latest_session))
        qa_data = parser.create_formatted_json()
        return qa_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from livekit import api

@app.post("/api/start-agent")
async def start_agent(request: dict):
    """
    Start the LiveKit voice agent in a specific room.
    """
    room_name = request.get("room")
    if not room_name:
        raise HTTPException(status_code=400, detail="Room name is required")

    try:
        lk = api.LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        )

        # Ensure room exists or create it
        await lk.room.create(room_name)

        # Start the agent worker
        await lk.agent.start(
            agent_id="expungement-agent",   # this must match the ID you configure in your worker
            room=room_name,
        )

        return {"status": "agent_started", "room": room_name}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    # Make sure session directory exists
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Starting FastAPI server...")
    print(f"Session directory: {SESSION_DIR}")
    print(f"API documentation available at http://localhost:5001/docs")
    print(f"\nAPI endpoints:")
    print(f"  GET /api/health - Health check")
    print(f"  GET /api/sessions - List all sessions")
    print(f"  POST /api/token - Generate LiveKit connection token")
    print(f"  GET /api/latest - Get most recent session")
    print(f"  GET /api/latest/qa - Get parsed Q&A for most recent session")
    print(f"  POST /api/latest/qa - Send parsed Q&A JSON (use this!)")
    print(f"  GET /api/session/{{session_id}} - Get specific session")
    print(f"  GET /api/session/{{session_id}}/qa - Get parsed Q&A for specific session")
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
