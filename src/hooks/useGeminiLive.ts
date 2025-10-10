import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { ai, SYSTEM_INSTRUCTION } from '../config/api';
import { TranscriptEntry } from '../types';

// --- Helper Functions for Audio Encoding/Decoding ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


export const useGeminiLive = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);


    const sessionPromiseRef = useRef<ReturnType<typeof ai.live.connect> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // Refs for controlling state within callbacks
    const isListeningRef = useRef(false);
    const isPausedRef = useRef(false);
    useEffect(() => { isPausedRef.current = isPaused }, [isPaused]);
    
    // Audio playback queue state
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             outputAudioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsConnected(false);
        setIsListening(false);
        setIsPaused(false);
        setSuggestions([]);
        isListeningRef.current = false;
        isPausedRef.current = false;
    }, []);
    
    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close();
            });
            sessionPromiseRef.current = null;
        }
        cleanup();
    }, [cleanup]);

    const generateSuggestions = useCallback(async (transcriptHistory: TranscriptEntry[]) => {
        setIsGeneratingSuggestions(true);
        setSuggestions([]);

        const context = transcriptHistory
            .filter(e => e.speaker !== 'system')
            .slice(-4) 
            .map(e => `${e.speaker === 'user' ? 'Kaelen' : 'Welt'}: ${e.text}`)
            .join('\n');

        if (!context) {
            setIsGeneratingSuggestions(false);
            return;
        }

        const prompt = `
            Basierend auf diesem kürzlichen Gesprächskontext aus einem Rollenspiel, generiere 3 kurze, unterschiedliche und spoilerfreie Vorschläge, was der Spieler (Kaelen) als Nächstes sagen oder fragen könnte.
            Die Vorschläge sollten als direkte, sprechbare Sätze formuliert sein (z.B. "Ich sollte meine Taschen überprüfen.", "Wer sind Sie?", "Was ist dieser Ort?").
            Gib eine JSON-Liste von Strings zurück. Generiere nichts anderes als diese Liste.

            Kontext:
            ---
            ${context}
            ---
        `;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
            const suggestionsArray = JSON.parse(response.text);
            setSuggestions(suggestionsArray);
        } catch (error) {
            console.error("Failed to generate suggestions:", error);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    }, []);

    const startSession = useCallback(async () => {
        if (sessionPromiseRef.current) {
            console.log("Session already in progress.");
            return;
        }
        
        setIsPaused(false);
        isPausedRef.current = false;
        setTranscript([{ speaker: 'system', text: 'Stelle Verbindung her...'}]);

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        } catch (error) {
            console.error("Microphone access denied:", error);
            setTranscript([{ speaker: 'system', text: 'Fehler: Mikrofonzugriff verweigert.'}]);
            return;
        }
        
        inputAudioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
        outputAudioContextRef.current = new window.AudioContext({ sampleRate: 24000 });

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setTranscript(prev => [...prev.filter(e => e.text !== 'Stelle Verbindung her...'), { speaker: 'system', text: 'Verbindung hergestellt. Du kannst jetzt sprechen.'}]);
                    setIsConnected(true);
                    setIsListening(true);
                    isListeningRef.current = true;
                    
                    if (!streamRef.current || !inputAudioContextRef.current) return;
                    
                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        if (!isListeningRef.current) return; // Don't process audio if AI is speaking or session is paused

                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const hasModelOutput = message.serverContent?.outputTranscription || message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;

                    if (hasModelOutput && isListeningRef.current) {
                        setIsListening(false);
                        isListeningRef.current = false;
                        setSuggestions([]); // Clear suggestions when user starts talking or AI starts responding.
                    }

                    // Handle streaming transcription
                    if (message.serverContent?.inputTranscription) {
                        const textChunk = message.serverContent.inputTranscription.text;
                        setTranscript(prev => {
                            const lastEntry = prev[prev.length - 1];
                            if (lastEntry && lastEntry.speaker === 'user') {
                                const updatedLastEntry = { ...lastEntry, text: lastEntry.text + textChunk };
                                return [...prev.slice(0, -1), updatedLastEntry];
                            } else {
                                return [...prev, { speaker: 'user', text: textChunk }];
                            }
                        });
                    }

                    if (message.serverContent?.outputTranscription) {
                        const textChunk = message.serverContent.outputTranscription.text;
                        setTranscript(prev => {
                            const lastEntry = prev[prev.length - 1];
                            if (lastEntry && lastEntry.speaker === 'model') {
                                const updatedLastEntry = { ...lastEntry, text: lastEntry.text + textChunk };
                                return [...prev.slice(0, -1), updatedLastEntry];
                            } else {
                                return [...prev, { speaker: 'model', text: textChunk }];
                            }
                        });
                    }

                    if (message.serverContent?.turnComplete) {
                        if (!isPausedRef.current) {
                           setIsListening(true);
                           isListeningRef.current = true;
                        }
                        setTranscript(currentTranscript => {
                            generateSuggestions(currentTranscript);
                            return currentTranscript;
                        });
                    }

                    // Handle audio playback
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current && !isMuted) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                        });
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("WebSocket Error:", e);
                    setTranscript(prev => [...prev, { speaker: 'system', text: `Ein Verbindungsfehler ist aufgetreten: ${e.message}` }]);
                    stopSession();
                },
                onclose: (e: CloseEvent) => {
                    setTranscript(prev => [...prev.filter(e => e.speaker !== 'system'), { speaker: 'system', text: 'Verbindung getrennt.' }]);
                    cleanup(); // Use cleanup instead of stopSession to avoid closing a session that's already closed.
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
    }, [stopSession, isMuted, cleanup, generateSuggestions]);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const isNowPaused = !prev;
            isPausedRef.current = isNowPaused;
            if (isNowPaused) {
                // Pausing
                isListeningRef.current = false;
                setIsListening(false);
            } else {
                // Resuming, but only if it's the user's turn.
                // We optimistically set listening to true. The onmessage handler
                // will correct this if the AI is still speaking.
                isListeningRef.current = true;
                setIsListening(true);
            }
            return isNowPaused;
        });
    }, []);

    const toggleMute = useCallback(() => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (newMutedState) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
            }
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    }, [isMuted]);
    
    useEffect(() => {
        return () => {
            if (isConnected) {
                stopSession();
            }
        };
    }, [isConnected, stopSession]);

    return { isConnected, isMuted, isListening, isPaused, transcript, suggestions, startSession, stopSession, toggleMute, togglePause };
};