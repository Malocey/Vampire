import os
import asyncio
import json
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

# Vereinfachter System-Prompt, da die Stimmen von Google kommen
SYSTEM_INSTRUCTION = """
You are the Game Master for "Crimson Academy: The Awakened Blood", a voice-driven, interactive RPG.
Your primary role is to narrate the story, embody all Non-Player Characters (NPCs), and react to the player's spoken words.
You generate the story, the world, and all its inhabitants. Keep your responses concise and engaging.
"""

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Richte das Gemini-Modell für bi-direktionales Audio-Streaming ein
    model = genai.GenerativeModel(
        'gemini-1.5-pro',
        system_instruction=SYSTEM_INSTRUCTION,
        safety_settings={ # Sicherheitseinstellungen lockern, um Spiel-Inhalte (Gewalt etc.) nicht zu blockieren
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )

    try:
        print("INFO: Client connected. Starting bi-directional audio stream with Gemini.")

        # Starte die Konversation. `iter_content` gibt uns einen Stream von Antworten.
        convo = model.iter_content(
            history=[],
            response_mime_type="audio/pcm",
            response_audio_sample_rate=24000,
        )

        # Warte auf das Startsignal vom Client
        initial_message = await websocket.receive_text()
        if initial_message != "START_SESSION":
            print(f"WARNING: Invalid start signal received: {initial_message}. Closing connection.")
            await convo.close()
            return

        # Sende eine erste leere Anfrage, um die Begrüßung der KI auszulösen
        await convo.send_message_async({"audio": b""})

        async def forward_audio_to_gemini():
            """Nimmt Audio vom Client entgegen und leitet es an Gemini weiter."""
            while True:
                try:
                    audio_chunk = await websocket.receive_bytes()
                    await convo.send_message_async({"audio": audio_chunk})
                except WebSocketDisconnect:
                    print("INFO: Client WebSocket disconnected during audio forwarding.")
                    break
                except Exception as e:
                    print(f"ERROR during audio forwarding: {e}")
                    break

        async def forward_responses_to_client():
            """Nimmt Antworten von Gemini (Audio & Text) und leitet sie an den Client weiter."""
            try:
                async for chunk in convo:
                    # Leite die rohen Audiodaten direkt als binäre Nachricht weiter
                    if chunk.audio:
                        await websocket.send_bytes(chunk.audio)

                    # Sende Transkriptionen als JSON-Nachricht
                    if chunk.text:
                        # Unterscheide zwischen Spieler- und Modell-Transkription
                        speaker = 'user' if chunk.role == 'user' else 'model'
                        message = {
                            "type": "transcript",
                            "speaker": speaker,
                            "text": chunk.text
                        }
                        await websocket.send_text(json.dumps(message))

            except Exception as e:
                print(f"ERROR receiving from Gemini: {e}")

        # Starte beide Aufgaben parallel
        gemini_task = asyncio.create_task(forward_responses_to_client())
        client_task = asyncio.create_task(forward_audio_to_gemini())

        # Warte, bis eine der Aufgaben beendet ist
        done, pending = await asyncio.wait(
            [gemini_task, client_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        # Bereinige die verbleibenden Aufgaben
        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        print("INFO: Client disconnected.")
    except Exception as e:
        print(f"ERROR in WebSocket endpoint: {e}")
    finally:
        if 'convo' in locals() and convo:
            await convo.close()
        if not websocket.client_state == WebSocketDisconnect:
             await websocket.close()
        print("INFO: Connection closed and resources cleaned up.")