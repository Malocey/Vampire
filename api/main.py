import os
import asyncio
import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv

# Lade Umgebungsvariablen
load_dotenv(dotenv_path='../.env.local')
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# CORS-Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basis-System-Prompt
BASE_SYSTEM_INSTRUCTION = """
You are the Game Master for "Crimson Academy: The Awakened Blood", a voice-driven, interactive RPG.
Your primary role is to narrate the story, embody all Non-Player Characters (NPCs), and react to the player's spoken words.
You generate the story, the world, and all its inhabitants. Keep your responses concise and engaging.
When you speak as a character, you MUST adopt a unique voice persona for them. Monotony is a failure of your core directive.
"""

sessions = {}

# --- Spiellogik (vereinfacht) ---
CODEX_KEYWORDS = {"codex_vampire_basics": ["vampir", "blut"], "codex_academy": ["akademie"]}
QUEST_TRIGGERS = {"mq01_obj1": ["trainingsgelände", "trainingsplatz"]}

async def process_game_logic(text: str, websocket: WebSocket, player_state: dict):
    """
    Analysiert den KI-Text und sendet Spiel-Ereignisse an das Frontend.
    HINWEIS: In einer echten App würde der 'player_state' aus einer DB geladen.
    Hier simulieren wir es, um zu zeigen, wie es funktionieren würde.
    """
    lower_text = text.lower()

    # Beispiel für Codex-Freischaltung
    for codex_id, keywords in CODEX_KEYWORDS.items():
        if any(keyword in lower_text for keyword in keywords):
            # Hier würde man prüfen, ob der Eintrag schon freigeschaltet ist
            await websocket.send_text(json.dumps({"type": "codex_unlocked", "data": {"id": codex_id}}))

    # Beispiel für Quest-Update
    for objective_id, keywords in QUEST_TRIGGERS.items():
        if any(keyword in lower_text for keyword in keywords):
            # Hier würde man prüfen, ob die Quest aktiv und das Ziel noch offen ist
            await websocket.send_text(json.dumps({"type": "quest_objective_completed", "data": {"objective_id": objective_id}}))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    sessions[session_id] = {"history": []}

    model = genai.GenerativeModel('gemini-1.5-pro', system_instruction=BASE_SYSTEM_INSTRUCTION)

    try:
        print(f"INFO: Session {session_id} started.")
        # `start_chat` anstatt `iter_content`, um die History manuell zu verwalten
        convo = model.start_chat(history=sessions[session_id]["history"])

        initial_message = await websocket.receive_text()
        if initial_message != "START_SESSION": return

        # Die `send_message_async` in `start_chat` gibt einen `AsyncIterator` zurück
        response_iterator = await convo.send_message_async("START_GAME", stream=True)

        full_text = ""
        async for chunk in response_iterator:
            if chunk.audio: await websocket.send_bytes(chunk.audio)
            if chunk.text: full_text += chunk.text

        await websocket.send_text(json.dumps({"type": "transcript", "speaker": "model", "text": full_text}))
        await process_game_logic(full_text, websocket, sessions[session_id])
        sessions[session_id]["history"] = convo.history

        while True:
            message = await websocket.receive()

            content = None
            if "bytes" in message:
                content = {"audio": message["bytes"]}
            elif "text" in message:
                 content = message["text"]

            if not content: continue

            response_iterator = await convo.send_message_async(content, stream=True)

            full_text = ""
            async for chunk in response_iterator:
                if chunk.audio: await websocket.send_bytes(chunk.audio)
                if chunk.text: full_text += chunk.text

            speaker = 'user' if convo.history[-2].role == 'user' else 'model'
            await websocket.send_text(json.dumps({"type": "transcript", "speaker": speaker, "text": full_text}))
            await process_game_logic(full_text, websocket, sessions[session_id])
            sessions[session_id]["history"] = convo.history

    except WebSocketDisconnect:
        print(f"INFO: Client disconnected from session {session_id}.")
    except Exception as e:
        print(f"ERROR in session {session_id}: {e}")
    finally:
        if session_id in sessions: del sessions[session_id]
        if not websocket.client_state == WebSocketDisconnect: await websocket.close()
        print(f"INFO: Session {session_id} closed.")