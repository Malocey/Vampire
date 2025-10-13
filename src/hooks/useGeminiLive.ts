import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { ai, SYSTEM_INSTRUCTION } from '../config/api';
import { VOICE_CHARACTERISTICS } from '../config/gameConfig';
import { TranscriptEntry, PlayerData, CategorizedSuggestion, QuestObjective, CodexEntry, PrebuiltVoice, API_MODULES } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { useApiStatusStore } from '../store/useApiStatusStore';
import { isQuotaError } from '../utils/errorUtils';
import { INITIAL_MAP_DATA } from '../config/mapData';

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

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


export const useGeminiLive = () => {
    const { playerData, setPlayerData, updateTranscript } = usePlayerStore();
    const { setModuleStatus } = useApiStatusStore();
    const transcript = playerData?.transcript || [];
    
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [suggestions, setSuggestions] = useState<CategorizedSuggestion[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [isProcessingText, setIsProcessingText] = useState(false);

    const prevIsListening = usePrevious(isListening);

    const sessionPromiseRef = useRef<ReturnType<typeof ai.live.connect> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const isListeningRef = useRef(false);
    const isPausedRef = useRef(false);
    useEffect(() => { isPausedRef.current = isPaused }, [isPaused]);
    
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
            Basierend auf dem folgenden Rollenspiel-Gesprächskontext, generiere 5 kurze, unterschiedliche Vorschläge, was der Spieler (Kaelen) als Nächstes sagen oder tun könnte.
            Kategorisiere jeden Vorschlag als "Untersuchung" (für das Sammeln von Informationen), "Dialog" (für Gespräche) oder "Aktion" (für Handlungen).
            Gib eine gute Mischung aus allen Kategorien, aber lege einen Schwerpunkt auf interaktive "Dialog"- und "Aktion"-Optionen.
            Gib ein JSON-Array von Objekten zurück, jedes mit den Schlüsseln "text" und "category". Generiere nichts anderes.

            Beispiel-Output:
            [
                {"text": "Schau dich im Raum um.", "category": "Untersuchung"},
                {"text": "Wer sind Sie?", "category": "Dialog"},
                {"text": "Versuche, die Tür zu öffnen.", "category": "Aktion"}
            ]

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
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                category: { type: Type.STRING, enum: ['Untersuchung', 'Dialog', 'Aktion'] }
                            },
                            required: ['text', 'category']
                        }
                    }
                }
            });
            const suggestionsArray = JSON.parse(response.text);
            setSuggestions(suggestionsArray);
        } catch (error) {
             if (isQuotaError(error)) {
                setModuleStatus('suggestions', 'unavailable');
            } else {
                console.error("Failed to generate suggestions:", error);
            }
        } finally {
            setIsGeneratingSuggestions(false);
        }
    }, [setModuleStatus]);
    
    useEffect(() => {
        if (prevIsListening && !isListening && transcript.length > 0) {
            const lastSpeaker = transcript[transcript.length - 1]?.speaker;
            if ((lastSpeaker === 'user' || lastSpeaker === 'model') && !isProcessingText) {
                 generateSuggestions(transcript);
            }
        }
    }, [isListening, prevIsListening, transcript, generateSuggestions, isProcessingText]);

    const updateNpcMemory = useCallback(async (conversation: TranscriptEntry[], npc: CodexEntry) => {
        const currentPlayerData = usePlayerStore.getState().playerData;
        if (!currentPlayerData) return;

        const prompt = `
            Du bist der NSC "${npc.title}". Basierend auf dem folgenden Dialog mit dem Spieler Kaelen, fasse deine wichtigsten Eindrücke und Erkenntnisse in einem kurzen Satz zusammen. Konzentriere dich auf deine Gefühle, dein Misstrauen, deine Neugier oder deine Absichten ihm gegenüber.

            Dialog:
            ${conversation.map(e => `${e.speaker === 'user' ? 'Kaelen' : npc.title}: ${e.text}`).join('\n')}

            Deine Zusammenfassung (ein Satz):
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const memory = response.text.trim();
            const newPlayerData = JSON.parse(JSON.stringify(currentPlayerData));
            newPlayerData.npcMemories[npc.id] = memory;
            setPlayerData(newPlayerData);
        } catch (error) {
            if (isQuotaError(error)) {
                setModuleStatus('memory', 'unavailable');
            } else {
                console.error(`Failed to update memory for ${npc.title}:`, error);
            }
        }
    }, [setPlayerData, setModuleStatus]);

    const processModelResponse = useCallback((text: string) => {
        const currentPlayerData = usePlayerStore.getState().playerData;
        if (!currentPlayerData) return;
    
        let updated = false;
        const newPlayerData = JSON.parse(JSON.stringify(currentPlayerData));
        const systemMessages: string[] = [];
    
        const createKeywordRegex = (keywords: string[]) => {
            const escapedKeywords = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
            return new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'i');
        };
    
        newPlayerData.codex.forEach((entry: CodexEntry) => {
            if (!entry.unlocked) {
                const regex = createKeywordRegex(entry.keywords);
                if (regex.test(text)) {
                    entry.unlocked = true;
                    updated = true;
                    systemMessages.push(`System: Datenbankeintrag freigeschaltet - ${entry.title}`);
                }
            }
        });
    
        newPlayerData.mapData.forEach((location: any) => {
            if (!location.discovered) {
                const regex = createKeywordRegex(location.keywords);
                if (regex.test(text)) {
                    location.discovered = true;
                    updated = true;
                    systemMessages.push(`System: Neuer Ort auf der Karte entdeckt - ${location.name}`);
                }
            }
        });
    
        newPlayerData.quests.forEach((quest: any) => {
            if (quest.status === 'active') {
                quest.objectives.forEach((objective: QuestObjective) => {
                    if (!objective.completed && objective.trigger) {
                        const [action, value] = objective.trigger.split(':');
                        let conditionMet = false;
    
                        if (action === 'visit') {
                            const location = INITIAL_MAP_DATA.find(loc => loc.id === value);
                            if (location) {
                                const locationRegex = createKeywordRegex(location.keywords);
                                if (locationRegex.test(text)) {
                                    conditionMet = true;
                                }
                            }
                        }
    
                        if (conditionMet) {
                            objective.completed = true;
                            updated = true;
                            systemMessages.push(`System: Quest-Ziel aktualisiert - "${objective.text}" abgeschlossen.`);
                        }
                    }
                });
            }
        });
    
        if (updated) {
            setPlayerData(newPlayerData);
            if (systemMessages.length > 0) {
                updateTranscript(prev => [
                    ...prev,
                    ...systemMessages.map(msg => ({ speaker: 'system', text: msg })) as TranscriptEntry[]
                ]);
            }
        }
    }, [setPlayerData, updateTranscript]);
    
    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const isNowPaused = !prev;
            isPausedRef.current = isNowPaused;
            if (isNowPaused) {
                isListeningRef.current = false;
                setIsListening(false);
            } else {
                isListeningRef.current = true;
                setIsListening(true);
            }
            return isNowPaused;
        });
    }, []);

    const selectSuggestion = useCallback(async (text: string) => {
        if (isProcessingText) return;

        setIsProcessingText(true);
        let sessionWasPaused = false;
        if (isConnected && !isPaused) {
            togglePause();
            sessionWasPaused = true;
        }
        
        updateTranscript(prev => [...prev, { speaker: 'user', text }]);
        setIsListening(false);
        setSuggestions([]);

        const history = [...transcript, { speaker: 'user', text }]
            .filter(e => e.speaker !== 'system')
            .map(e => `${e.speaker === 'user' ? 'Du sagst' : 'Die Welt antwortet'}: "${e.text}"`)
            .join('\n');

        let fullResponse = "";
        try {
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: `${SYSTEM_INSTRUCTION}\n\n**Bisheriger Gesprächsverlauf:**\n${history}\n\n**Deine nächste Antwort als Spielleiter:**`,
            });

            updateTranscript(prev => [...prev, { speaker: 'model', text: "" }]);

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    updateTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.speaker === 'model') {
                            last.text += chunkText;
                            return [...prev.slice(0, -1), last];
                        }
                        return prev;
                    });
                }
            }
            
            processModelResponse(fullResponse);
            generateSuggestions([...transcript, { speaker: 'user', text }, { speaker: 'model', text: fullResponse }]);

        } catch (error) {
             if (isQuotaError(error)) {
                setModuleStatus('narrative', 'unavailable');
            } else {
                console.error("Error during text-based interaction:", error);
                updateTranscript(prev => [...prev, { speaker: 'system', text: 'Ein kritischer Systemfehler ist aufgetreten.' }]);
            }
        } finally {
            setIsProcessingText(false);
            if (sessionWasPaused) {
                togglePause();
            }
        }

    }, [isProcessingText, isConnected, isPaused, togglePause, transcript, processModelResponse, generateSuggestions, updateTranscript, setModuleStatus]);

    const startSession = useCallback(async () => {
        const initialPlayerData = usePlayerStore.getState().playerData;
        if (sessionPromiseRef.current || !initialPlayerData) {
            return;
        }
        
        setIsPaused(false);
        isPausedRef.current = false;
        updateTranscript(prev => [...prev, { speaker: 'system', text: 'Stelle Verbindung her...'}]);

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        } catch (error) {
            console.error("Microphone access denied:", error);
            updateTranscript(prev => [...prev, { speaker: 'system', text: 'Fehler: Mikrofonzugriff verweigert.'}]);
            return;
        }
        
        inputAudioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
        outputAudioContextRef.current = new window.AudioContext({ sampleRate: 24000 });

        let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
        
        const npcCodex = initialPlayerData.codex.filter(c => c.category === 'Personen' && c.voice);
        if (npcCodex.length > 0) {
            let voiceProfiles = '\n\n-- Spezifische NPC-Stimmprofile --\n';
            npcCodex.forEach(npc => {
                 if (npc.voice && VOICE_CHARACTERISTICS[npc.voice]) {
                    const characteristic = VOICE_CHARACTERISTICS[npc.voice];
                    voiceProfiles += `- **${npc.title} (Stimme '${npc.voice}'):** Nutze eine Stimme, die '${characteristic}' ist. Deine Darstellung muss den Charakterdetails entsprechen: "${npc.content}"\n`;
                 }
            });
            dynamicSystemInstruction += voiceProfiles;
        }

        const memories = Object.entries(initialPlayerData.npcMemories);
        if (memories.length > 0) {
            const memoryLog = memories.map(([npcId, memory]) => {
                const npcName = npcCodex.find(c => c.id === npcId)?.title || 'Unbekannt';
                return `- ${npcName}: ${memory}`;
            }).join('\n');
            dynamicSystemInstruction += `\n\n-- Gedächtnisprotokolle --\n${memoryLog}`;
        }


        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    updateTranscript(prev => [...prev.filter(e => e.text !== 'Stelle Verbindung her...'), { speaker: 'system', text: 'Verbindung hergestellt. Du kannst jetzt sprechen.'}]);
                    setIsConnected(true);
                    setIsListening(true);
                    isListeningRef.current = true;
                    
                    if (!streamRef.current || !inputAudioContextRef.current) return;
                    
                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        if (!isListeningRef.current) return;

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
                        setSuggestions([]);
                    }

                    if (message.serverContent?.inputTranscription) {
                        const textChunk = message.serverContent.inputTranscription.text;
                        updateTranscript(prev => {
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
                        updateTranscript(prev => {
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
                        const currentTranscript = usePlayerStore.getState().playerData?.transcript || [];
                        const lastTurn = currentTranscript.slice(-2);
                        const lastModelResponse = lastTurn.find(e => e.speaker === 'model')?.text;
                        if (lastModelResponse) {
                            processModelResponse(lastModelResponse);

                            const currentNpcCodex = usePlayerStore.getState().playerData?.codex.filter(c => c.category === 'Personen') || [];
                            for(const npc of currentNpcCodex) {
                                if(new RegExp(`\\b${npc.title.split(' ')[1]}\\b`, 'i').test(lastModelResponse)) {
                                    updateNpcMemory(lastTurn, npc);
                                    break; 
                                }
                            }
                        }
                    }

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
                    setModuleStatus('live', 'unavailable');
                    stopSession();
                },
                onclose: (e: CloseEvent) => {
                    updateTranscript(prev => [...prev.filter(e => e.speaker !== 'system'), { speaker: 'system', text: 'Verbindung getrennt.' }]);
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: dynamicSystemInstruction,
            },
        });
    }, [stopSession, isMuted, cleanup, processModelResponse, updateTranscript, updateNpcMemory, setModuleStatus]);

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

    return { isConnected, isMuted, isListening, isPaused, transcript, suggestions, startSession, stopSession, toggleMute, togglePause, selectSuggestion };
};