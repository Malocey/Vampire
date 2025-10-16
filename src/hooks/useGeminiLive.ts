import { useState, useRef, useCallback, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws';

// Hilfsfunktion zum Dekodieren von PCM-Audiodaten
async function decodePcm(
  pcmData: ArrayBuffer,
  audioContext: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
    const frameCount = pcmData.byteLength / (2 * numChannels);
    const audioBuffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const dataView = new DataView(pcmData);

    for (let i = 0; i < frameCount; i++) {
        const int = dataView.getInt16(i * 2, true);
        channelData[i] = int / 32768.0;
    }
    return audioBuffer;
}

export const useGeminiLive = () => {
    const { playerData, setPlayerData, updateTranscript } = usePlayerStore();
    const transcript = playerData?.transcript || [];

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

    const playAudioQueue = useCallback(() => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0 || isMuted) return;
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
            playAudioQueue();
        };
    }, [isMuted]);

    const cleanup = useCallback(() => {
        if (websocketRef.current) websocketRef.current.close();
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
        websocketRef.current.binaryType = 'arraybuffer';

        websocketRef.current.onopen = async () => {
            setIsConnected(true);
            setIsListening(true);
            isListeningRef.current = true;
            updateTranscript(prev => [...prev.filter(e => e.text !== 'Stelle Verbindung zum Server her...'), { speaker: 'system', text: 'Verbindung hergestellt.' }]);
            try {
                if (!inputAudioContextRef.current) return;
                await inputAudio-worklet-processor-and-decoder-logic
                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current!);
                audioWorkletNodeRef.current = new AudioWorkletNode(inputAudioContextRef.current, 'audio-processor');
                audioWorkletNodeRef.current.port.onmessage = (event) => {
                    if (event.data.type === 'audioData' && isListeningRef.current && websocketRef.current?.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(event.data.data);
                    }
                };
                audioWorkletNodeRef.current.port.postMessage({ type: 'start', micOpen: true });
                mediaStreamSourceRef.current.connect(audioWorkletNodeRef.current);
                websocketRef.current.send("START_SESSION");
            } catch (e) {
                console.error('Fehler beim Laden des Audio-Worklets:', e);
                stopSession();
            }
        };

        websocketRef.current.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case 'transcript':
                        updateTranscript(prev => [...prev, { speaker: message.speaker, text: message.text }]);
                        break;
                    case 'codex_unlocked':
                        if (playerData) {
                            const newPlayerData = { ...playerData };
                            const codex = newPlayerData.codex.find(c => c.id === message.data.id);
                            if (codex && !codex.unlocked) {
                                codex.unlocked = true;
                                setPlayerData(newPlayerData);
                                updateTranscript(prev => [...prev, { speaker: 'system', text: `Datenbankeintrag freigeschaltet: ${codex.title}` }]);
                            }
                        }
                        break;
                    case 'quest_objective_completed':
                        if (playerData) {
                            const newPlayerData = { ...playerData };
                            let updated = false;
                            for (const quest of newPlayerData.quests) {
                                const objective = quest.objectives.find(o => o.text.toLowerCase().includes(message.data.objective_id.toLowerCase()) && !o.completed);
                                if (objective) {
                                    objective.completed = true;
                                    updateTranscript(prev => [...prev, { speaker: 'system', text: `Quest-Ziel abgeschlossen: ${objective.text}` }]);
                                    updated = true;
                                    break;
                                }
                            }
                            if (updated) {
                                setPlayerData(newPlayerData);
                            }
                        }
                        break;
                }
            } else if (event.data instanceof ArrayBuffer) {
                if (isMuted || !outputAudioContextRef.current) return;
                const audioBuffer = await decodePcm(event.data, outputAudioContextRef.current);
                audioQueueRef.current.push(audioBuffer);
                playAudioQueue();
            }
        };

        websocketRef.current.onerror = (error) => {
            console.error("WebSocket Fehler:", error);
            stopSession();
        };

        websocketRef.current.onclose = () => {
            cleanup();
        };
    }, [cleanup, isMuted, playAudioQueue, stopSession, updateTranscript, playerData, setPlayerData]);

    const selectSuggestion = useCallback((text: string) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(text);
            updateTranscript(prev => [...prev, { speaker: 'user', text }]);
        }
    }, [updateTranscript]);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

    useEffect(() => () => cleanup(), [cleanup]);

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
        selectSuggestion
    };
};