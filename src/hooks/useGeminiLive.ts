import { useState, useRef, useCallback, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws';

// Hilfsfunktion zum Dekodieren von PCM-Audiodaten in einen AudioBuffer
async function decodePcm(
  pcmData: ArrayBuffer,
  audioContext: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
    const frameCount = pcmData.byteLength / (2 * numChannels); // 16-bit PCM
    const audioBuffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const dataView = new DataView(pcmData);

    for (let i = 0; i < frameCount; i++) {
        // Lese 16-bit little-endian integer
        const int = dataView.getInt16(i * 2, true);
        // Konvertiere zu float in den Bereich [-1.0, 1.0]
        channelData[i] = int / 32768.0;
    }

    return audioBuffer;
}


export const useGeminiLive = () => {
    const { updateTranscript } = usePlayerStore();
    const transcript = usePlayerStore((state) => state.playerData?.transcript || []);

    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const websocketRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);

    const isListeningRef = useRef(true);
    useEffect(() => { isListeningRef.current = isListening }, [isListening]);

    // --- Audio-Wiedergabe Logik ---
    const playAudioQueue = useCallback(() => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0 || isMuted) {
            return;
        }
        isPlayingRef.current = true;

        const audioContext = outputAudioContextRef.current;
        if (!audioContext) {
            isPlayingRef.current = false;
            return;
        }

        const buffer = audioQueueRef.current.shift();
        if (!buffer) {
            isPlayingRef.current = false;
            return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        const startTime = Math.max(nextStartTimeRef.current, audioContext.currentTime);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            isPlayingRef.current = false;
            playAudioQueue(); // Spiele das nächste Stück in der Warteschlange
        };

    }, [isMuted]);

    // --- Bereinigung ---
    const cleanup = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        // ... (restliche Bereinigungslogik bleibt gleich)
        if (audioWorkletNodeRef.current) audioWorkletNodeRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        setIsConnected(false);
        setIsListening(false);
        isListeningRef.current = false;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    // --- Sitzungssteuerung ---
    const stopSession = useCallback(() => {
        cleanup();
        updateTranscript(prev => [...prev, { speaker: 'system', text: 'Verbindung getrennt.' }]);
    }, [cleanup, updateTranscript]);

    const startSession = useCallback(async () => {
        if (websocketRef.current) return;

        updateTranscript(() => [{ speaker: 'system', text: 'Stelle Verbindung zum Server her...' }]);

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        } catch (error) {
            console.error("Mikrofonzugriff verweigert:", error);
            updateTranscript(prev => [...prev, { speaker: 'system', text: 'Fehler: Mikrofonzugriff verweigert.' }]);
            return;
        }
        
        inputAudioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
        outputAudioContextRef.current = new window.AudioContext({ sampleRate: 24000 });
        
        websocketRef.current = new WebSocket(WEBSOCKET_URL);
        websocketRef.current.binaryType = 'arraybuffer'; // Wichtig für Audio-Daten

        websocketRef.current.onopen = async () => {
             // ... (Logik zum Einrichten des Audio-Worklets bleibt identisch)
            setIsConnected(true);
            setIsListening(true);
            isListeningRef.current = true;
            updateTranscript(prev => [...prev.filter(e => e.text !== 'Stelle Verbindung zum Server her...'), { speaker: 'system', text: 'Verbindung hergestellt. Du kannst sprechen.' }]);

            try {
                if (!inputAudioContextRef.current) return;
                await inputAudioContextRef.current.audioWorklet.addModule('audio-processor.js');
                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current!);
                audioWorkletNodeRef.current = new AudioWorkletNode(inputAudioContextRef.current, 'audio-processor');

                audioWorkletNodeRef.current.port.onmessage = (event) => {
                    if (event.data.type === 'audioData' && isListeningRef.current && websocketRef.current?.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(event.data.data);
                    }
                };

                audioWorkletNodeRef.current.port.postMessage({ type: 'start', micOpen: true });
                mediaStreamSourceRef.current.connect(audioWorkletNodeRef.current);
                audioWorkletNodeRef.current.connect(inputAudioContextRef.current.destination);

                websocketRef.current.send("START_SESSION");
            } catch (e) {
                console.error('Fehler beim Laden des Audio-Worklets:', e);
                updateTranscript(prev => [...prev, { speaker: 'system', text: 'Fehler: Audiomodul konnte nicht geladen werden.' }]);
                stopSession();
            }
        };

        websocketRef.current.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                // Verarbeite JSON-Nachrichten (Transkripte)
                const message = JSON.parse(event.data);
                if (message.type === 'transcript') {
                    if (message.speaker === 'user') {
                        setIsListening(false); // Stoppe das Lauschen, wenn der User spricht
                    }
                    updateTranscript(prev => {
                        const last = prev[prev.length - 1];
                        // Update das letzte Transkript-Segment, wenn der Sprecher derselbe ist
                        if (last && last.speaker === message.speaker) {
                            last.text += message.text;
                            return [...prev.slice(0, -1), last];
                        }
                        // Füge ein neues Segment hinzu
                        return [...prev, { speaker: message.speaker, text: message.text }];
                    });
                }
            } else if (event.data instanceof ArrayBuffer) {
                // Verarbeite binäre Nachrichten (Audio)
                if (isMuted || !outputAudioContextRef.current) return;
                const audioBuffer = await decodePcm(event.data, outputAudioContextRef.current);
                audioQueueRef.current.push(audioBuffer);
                playAudioQueue();
            }
        };

        websocketRef.current.onerror = (error) => {
            console.error("WebSocket Fehler:", error);
            updateTranscript(prev => [...prev, { speaker: 'system', text: 'Ein Verbindungsfehler ist aufgetreten.' }]);
            cleanup();
        };

        websocketRef.current.onclose = () => {
            console.log("WebSocket-Verbindung geschlossen.");
            cleanup();
            if (!isPaused) {
                setIsListening(true);
            }
        };

    }, [cleanup, isMuted, isPaused, playAudioQueue, stopSession, updateTranscript]);

    // --- Mute/Pause Logik ---
    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newMutedState = !prev;
            if (newMutedState) {
                audioQueueRef.current = []; // Leere die Warteschlange, wenn stumm geschaltet wird
            }
            return newMutedState;
        });
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const isNowPaused = !prev;
            setIsListening(!isNowPaused);
            return isNowPaused;
        });
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isConnected,
        isMuted,
        isListening,
        isPaused,
        transcript,
        suggestions: [],
        startSession,
        stopSession,
        toggleMute,
        togglePause,
        selectSuggestion: () => {} // Dummy
    };
};