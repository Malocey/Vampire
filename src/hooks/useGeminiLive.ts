import { useState, useRef, useCallback, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TranscriptEntry } from '../types';

// Die URL unseres Python-Backends
const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws';

export const useGeminiLive = () => {
    const { updateTranscript } = usePlayerStore();
    const transcript = usePlayerStore((state) => state.playerData?.transcript || []);

    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(true); // Standardmäßig auf Zuhören
    const [isPaused, setIsPaused] = useState(false);

    const websocketRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const isListeningRef = useRef(true);
    useEffect(() => { isListeningRef.current = isListening }, [isListening]);

    // --- Sprachausgabe (Text-to-Speech) ---
    const speak = useCallback((text: string, speaker: string, emotion: string) => {
        if (isMuted) return;

        const utterance = new SpeechSynthesisUtterance(text);

        // Versuche, eine passende Stimme zu finden
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('de')); // Bevorzuge deutsche Google-Stimmen
        if (speaker !== 'Narrator') {
            // Einfache Logik, um für verschiedene Sprecher verschiedene Stimmen zu nutzen
            // Dies kann in Zukunft durch eine komplexere Logik (z.B. über voiceConfig) ersetzt werden
            const speakerVoices = voices.filter(v => v.lang.startsWith('de'));
            const voiceIndex = Math.abs(speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % speakerVoices.length;
            selectedVoice = speakerVoices[voiceIndex] || selectedVoice;
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Emotionen könnten hier die Tonhöhe (pitch) oder Geschwindigkeit (rate) beeinflussen
        switch(emotion) {
            case 'happy': utterance.pitch = 1.2; break;
            case 'sad': utterance.pitch = 0.8; break;
            case 'angry': utterance.rate = 1.2; utterance.pitch = 0.9; break;
            case 'whispering': utterance.volume = 0.5; utterance.rate = 0.9; break;
            default: break;
        }

        window.speechSynthesis.speak(utterance);
    }, [isMuted]);


    // --- Bereinigung der Ressourcen ---
    const cleanup = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.port.postMessage({ type: 'start', micOpen: false });
            audioWorkletNodeRef.current.disconnect();
            audioWorkletNodeRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        window.speechSynthesis.cancel(); // Stoppt alle laufenden Sprachausgaben
        setIsConnected(false);
        setIsListening(false);
        isListeningRef.current = false;
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
        
        audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
        
        websocketRef.current = new WebSocket(WEBSOCKET_URL);

        websocketRef.current.onopen = async () => {
            setIsConnected(true);
            setIsListening(true);
            isListeningRef.current = true;
            updateTranscript(prev => [...prev.filter(e => e.text !== 'Stelle Verbindung zum Server her...'), { speaker: 'system', text: 'Verbindung hergestellt. Du kannst sprechen.' }]);

            // Audio-Worklet für die Mikrofonaufnahme einrichten
            try {
                if (!audioContextRef.current) return;
                await audioContextRef.current.audioWorklet.addModule('audio-processor.js');
                mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current!);
                audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');

                // Nachrichten vom Audio-Worklet (Audiodaten) an das Backend senden
                audioWorkletNodeRef.current.port.onmessage = (event) => {
                    if (event.data.type === 'audioData' && isListeningRef.current && websocketRef.current?.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(event.data.data);
                    }
                };

                audioWorkletNodeRef.current.port.postMessage({ type: 'start', micOpen: true });
                mediaStreamSourceRef.current.connect(audioWorkletNodeRef.current);
                audioWorkletNodeRef.current.connect(audioContextRef.current.destination);

                // Startsignal an den Server senden
                websocketRef.current.send("START_SESSION");

            } catch (e) {
                console.error('Fehler beim Laden des Audio-Worklets:', e);
                updateTranscript(prev => [...prev, { speaker: 'system', text: 'Fehler: Audiomodul konnte nicht geladen werden.' }]);
                stopSession();
            }
        };

        websocketRef.current.onmessage = (event) => {
            try {
                // Eingehende Nachrichten sind jetzt JSON-Objekte
                const message = JSON.parse(event.data);

                if (message.text) {
                    setIsListening(false); // Aufhören zu lauschen, während die KI spricht

                    // Update transcript
                    updateTranscript(prev => [...prev, { speaker: 'model', text: message.text }]);

                    // Speak the text
                    const utterance = new SpeechSynthesisUtterance(message.text);
                    const voices = window.speechSynthesis.getVoices();
                    let selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('de'));
                    if (message.speaker !== 'Narrator') {
                        const speakerVoices = voices.filter(v => v.lang.startsWith('de'));
                        const voiceIndex = Math.abs(message.speaker.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % speakerVoices.length;
                        selectedVoice = speakerVoices[voiceIndex] || selectedVoice;
                    }
                    if(selectedVoice) utterance.voice = selectedVoice;

                    switch(message.emotion) {
                        case 'happy': utterance.pitch = 1.2; break;
                        case 'sad': utterance.pitch = 0.8; break;
                        case 'angry': utterance.rate = 1.2; utterance.pitch = 0.9; break;
                        case 'whispering': utterance.volume = 0.5; utterance.rate = 0.9; break;
                        default: break;
                    }

                    // Wenn die Sprachausgabe beendet ist, wieder zuhören
                    utterance.onend = () => {
                         if (!isPaused) {
                            setIsListening(true);
                         }
                    };
                    window.speechSynthesis.speak(utterance);
                }
            } catch (error) {
                // Fallback für nicht-JSON-Nachrichten (z.B. einfache Textnachrichten vom Server)
                console.log("Received non-JSON message:", event.data);
                if (typeof event.data === 'string') {
                    updateTranscript(prev => [...prev, { speaker: 'model', text: event.data }]);
                    speak(event.data, 'Narrator', 'neutral');
                }
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
        };

    }, [cleanup, isPaused, speak, stopSession, updateTranscript]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        if (!isMuted) {
            window.speechSynthesis.cancel();
        }
    }, [isMuted]);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const isNowPaused = !prev;
            setIsListening(!isNowPaused);
            return isNowPaused;
        });
    }, []);

    // Stellt sicher, dass die Sprachausgabe beim Verlassen der Komponente gestoppt wird
    useEffect(() => {
        // Lade die Stimmen vorab, um sicherzustellen, dass sie beim ersten `speak`-Aufruf verfügbar sind
        window.speechSynthesis.getVoices();
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Dummy-Funktion, da dies nun vom Backend gehandhabt wird
    const selectSuggestion = (text: string) => {
        console.warn("selectSuggestion wird nicht mehr vom Frontend gesteuert.");
        // Zukünftig könnte dies eine Nachricht an das Backend senden, um eine Aktion auszulösen
        updateTranscript(prev => [...prev, { speaker: 'user', text }]);
        // Sende den Text via WebSocket an das Backend
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            // Wir müssen ein binäres Format für Sprache und ein Textformat für Texteingaben unterscheiden.
            // Fürs Erste senden wir es einfach als Text. Das Backend muss dies behandeln können.
            // websocketRef.current.send(text); // Dies würde eine Anpassung im Backend erfordern.
        }
    };

    return {
        isConnected,
        isMuted,
        isListening,
        isPaused,
        transcript,
        suggestions: [], // Vorerst leere Vorschläge
        startSession,
        stopSession,
        toggleMute,
        togglePause,
        selectSuggestion
    };
};