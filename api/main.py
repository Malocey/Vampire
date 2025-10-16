import os
import asyncio
import re
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus .env.local
load_dotenv(dotenv_path='../.env.local')

# Konfiguriere die Gemini-API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# CORS-Middleware für die Kommunikation mit dem Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_INSTRUCTION = """
You are the Game Master for "Crimson Academy: The Awakened Blood", a voice-driven, interactive RPG.
Your primary role is to narrate the story, embody all Non-Player Characters (NPCs), and react to the player's spoken words.

**Voice and Emotion Tagging:**
To enable dynamic voice changes, you MUST tag all dialogue and narration with special voice tags.
The format is `[voice:SPEAKER|EMOTION]text[/voice]`.

- **SPEAKER:** Can be 'Narrator', 'Kaelen' (the player character), or any NPC's name (e.g., 'Seraphina', 'Commander Valerius').
- **EMOTION:** Can be 'neutral', 'happy', 'sad', 'angry', 'surprised', 'whispering'.
- **Narrator:** Use 'Narrator' for all descriptive text and environmental storytelling.
- **Default:** If no specific emotion is needed, use 'neutral'.

**Example:**
[voice:Narrator|neutral]The corridor is dimly lit, the only sound is the distant hum of the station.[/voice]
[voice:Seraphina|happy]Kaelen! I'm so glad you could make it.[/voice]
"""

def parse_voice_tags(text: str) -> list[dict]:
    """Parst den Text und extrahiert Segmente mit Sprecher- und Emotions-Tags."""
    pattern = r'\[voice:(?P<speaker>[^|\]]+)\|(?P<emotion>[^\]]+)\](?P<text>.*?)\[/voice\]'
    segments = []
    last_end = 0

    for match in re.finditer(pattern, text, re.DOTALL):
        if match.start() > last_end:
            untagged_text = text[last_end:match.start()].strip()
            if untagged_text:
                segments.append({"speaker": "Narrator", "emotion": "neutral", "text": untagged_text})

        segments.append({
            "speaker": match.group('speaker').strip(),
            "emotion": match.group('emotion').strip(),
            "text": match.group('text').strip()
        })
        last_end = match.end()

    if last_end < len(text):
        remaining_text = text[last_end:].strip()
        if remaining_text:
            segments.append({"speaker": "Narrator", "emotion": "neutral", "text": remaining_text})

    if not segments:
        return [{"speaker": "Narrator", "emotion": "neutral", "text": text.strip()}]

    return segments

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_INSTRUCTION)
        chat = model.start_chat()
        print("INFO: Client connected, Gemini chat session started.")

        # Warte auf Startsignal vom Client
        initial_message = await websocket.receive_text()
        if initial_message != "START_SESSION":
            print("WARNING: Invalid start signal received. Closing connection.")
            return

        # Sende eine erste Begrüßungsnachricht
        initial_response = await asyncio.to_thread(chat.send_message, "START_GAME")
        full_text = "".join(chunk.text for chunk in initial_response if chunk.text)

        parsed_segments = parse_voice_tags(full_text)
        for segment in parsed_segments:
            await websocket.send_text(json.dumps(segment))

        # Haupt-Kommunikationsschleife
        while True:
            audio_bytes = await websocket.receive_bytes()
            response = await asyncio.to_thread(chat.send_message, {"audio": audio_bytes})

            full_text = "".join(chunk.text for chunk in response if chunk.text)
            parsed_segments = parse_voice_tags(full_text)

            for segment in parsed_segments:
                await websocket.send_text(json.dumps(segment))

    except WebSocketDisconnect:
        print("INFO: Client disconnected.")
    except Exception as e:
        print(f"ERROR: An error occurred: {e}")
        await websocket.close()