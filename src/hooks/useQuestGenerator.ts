import { useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ai } from '../config/api';
import { Quest, PlayerData, TranscriptEntry } from '../types';
import { useApiStatusStore } from '../store/useApiStatusStore';
import { isQuotaError } from '../utils/errorUtils';
import { Type } from '@google/genai';

export const useQuestGenerator = () => {
    const { playerData, setPlayerData } = usePlayerStore();
    const { setModuleStatus } = useApiStatusStore();

    const generateQuest = useCallback(async () => {
        if (!playerData) return;

        const existingQuests = playerData.quests.map(q => q.title).join(', ');
        const recentTranscript = playerData.transcript.slice(-5).map(t => `${t.speaker}: ${t.text}`).join('\n');

        const prompt = `
            You are a master storyteller and game designer for a dark, modern vampire RPG.
            Based on the player's current situation and recent events, create a new, compelling quest.
            The quest should feel like a natural extension of the story.

            Player's Situation:
            - Level: ${playerData.level}
            - Bloodline: ${playerData.bloodlineName}
            - Recent Events:
            ---
            ${recentTranscript}
            ---
            - Existing Quests: ${existingQuests}

            Instructions:
            1.  Generate a quest with a unique ID (e.g., "q_" + a short, relevant name).
            2.  Create a captivating title and a detailed description.
            3.  Design 2-3 objectives. If an objective involves a specific action like visiting a place or talking to someone, define a trigger for it (e.g., "visit:loc_main_library", "talk:npc_corvus").
            4.  Assign appropriate rewards, such as XP and blood essence.
            5.  The quest status must be 'active' and the type should be 'side'.

            Return the quest as a single JSON object.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            objectives: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING },
                                        completed: { type: Type.BOOLEAN },
                                        trigger: { type: Type.STRING },
                                    },
                                    required: ['text', 'completed'],
                                }
                            },
                            rewards: {
                                type: Type.OBJECT,
                                properties: {
                                    xp: { type: Type.NUMBER },
                                    essence: { type: Type.NUMBER },
                                    item: { type: Type.STRING },
                                },
                                required: ['xp']
                            },
                            status: { type: Type.STRING, enum: ['active'] },
                            type: { type: Type.STRING, enum: ['side'] },
                        },
                        required: ['id', 'title', 'description', 'objectives', 'rewards', 'status', 'type'],
                    },
                },
            });

            const newQuest = JSON.parse(response.text) as Quest;

            if (newQuest && !playerData.quests.some(q => q.id === newQuest.id)) {
                const systemMessage = `Neue Quest erhalten: ${newQuest.title}`;
                const newPlayerData = {
                    ...playerData,
                    quests: [...playerData.quests, newQuest],
                    transcript: [...playerData.transcript, { speaker: 'system', text: systemMessage }] as TranscriptEntry[],
                };
                setPlayerData(newPlayerData);
            }

        } catch (error) {
            if (isQuotaError(error)) {
                setModuleStatus('quests', 'unavailable');
            } else {
                console.error('Fehler beim Generieren der Quest:', error);
            }
        }
    }, [playerData, setPlayerData, setModuleStatus]);

    return { generateQuest };
};