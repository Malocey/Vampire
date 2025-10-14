import { useState, useCallback } from 'react';
import { ai } from '../config/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { isQuotaError } from '../utils/errorUtils';
import { useApiStatusStore } from '../store/useApiStatusStore';

const STORY_CHUNK_WORD_COUNT = 150;
const MAX_TOTAL_WORDS = 750; // Approximately 5 pages

export const useStoryGenerator = () => {
    const { playerData, updateTranscript } = usePlayerStore();
    const { setModuleStatus } = useApiStatusStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [story, setStory] = useState<string[]>([]);
    const [canContinue, setCanContinue] = useState(true);

    const generateStory = useCallback(async () => {
        if (!playerData || isGenerating || !canContinue) return;

        setIsGenerating(true);

        const currentWordCount = story.join(' ').split(/\s+/).length;
        if (currentWordCount >= MAX_TOTAL_WORDS) {
            setCanContinue(false);
            setIsGenerating(false);
            return;
        }

        const chronicle = playerData.transcript.filter(e => e.speaker === 'system' && e.text.startsWith('Chronik:'));
        const context = chronicle.map(e => e.text).join('\n\n');

        const prompt = `
            Du bist ein Chronist, der die Geschichte von Kaelen, einem Vampir, erzählt.
            Basierend auf der bisherigen Chronik, schreibe den nächsten Abschnitt der Geschichte.
            Schreibe ungefähr ${STORY_CHUNK_WORD_COUNT} Wörter.
            Die Geschichte sollte spannend und fesselnd sein.
            Beende den Abschnitt nicht abrupt, sondern sorge für einen natürlichen Übergang zum nächsten Teil.
            Wenn du denkst, dass die Geschichte zu einem natürlichen Ende kommt, beende sie mit "[ENDE]".
            Wichtige Schlüsselwörter, Orte oder Charaktere sollten mit *wort* markiert werden.

            Bisherige Chronik:
            ---
            ${context}
            ---

            Nächster Abschnitt:
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const newChunk = response.text.trim();

            if (newChunk.includes('[ENDE]')) {
                setCanContinue(false);
                const finalChunk = newChunk.replace('[ENDE]', '').trim();
                setStory(prev => [...prev, finalChunk]);
                updateTranscript(prev => [...prev, { speaker: 'system', text: `Chronik: ${finalChunk}` }]);
            } else {
                setStory(prev => [...prev, newChunk]);
                updateTranscript(prev => [...prev, { speaker: 'system', text: `Chronik: ${newChunk}` }]);
            }

        } catch (error) {
            if (isQuotaError(error)) {
                setModuleStatus('chronicle', 'unavailable');
            } else {
                console.error("Failed to generate story chunk:", error);
            }
        } finally {
            setIsGenerating(false);
        }
    }, [playerData, isGenerating, canContinue, story, updateTranscript, setModuleStatus]);

    return { isGenerating, story, canContinue, generateStory };
};