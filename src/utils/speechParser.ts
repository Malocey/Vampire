import { VoiceProfile } from '../types';
import { NARRATOR_VOICE, CHARACTER_VOICES, EMOTIONAL_VOICES } from '../config/voiceConfig';

export type SpeechJob =
    | { type: 'speech'; text: string; voiceProfile: VoiceProfile }
    | { type: 'sfx'; effect: string }
    | { type: 'music'; track: string };

export const parseSpeechCommands = (text: string): SpeechJob[] => {
    const jobs: SpeechJob[] = [];
    const regex = /\((.*?)\)\s*(.*?)(?=\s*\(|$)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const precedingText = text.substring(lastIndex, match.index).trim();
        if (precedingText) {
            jobs.push({ type: 'speech', text: precedingText, voiceProfile: NARRATOR_VOICE });
        }

        const command = match[1].trim().toLowerCase();
        const dialogue = match[2].trim();

        if (command.startsWith('sound effect:')) {
            const effect = command.replace('sound effect:', '').trim();
            jobs.push({ type: 'sfx', effect });
        } else if (command.startsWith('music:')) {
            const track = command.replace('music:', '').trim();
            jobs.push({ type: 'music', track });
        } else {
            const [speaker, ...emotionParts] = command.split(' stimme ');
            const emotion = emotionParts.join(' ').trim();

            const characterKey = Object.keys(CHARACTER_VOICES).find(key => key.toLowerCase() === speaker);
            let voiceProfile: VoiceProfile = NARRATOR_VOICE;

            if (characterKey && CHARACTER_VOICES[characterKey]) {
                voiceProfile = CHARACTER_VOICES[characterKey];
            }

            if (emotion && EMOTIONAL_VOICES[emotion]) {
                voiceProfile = { ...voiceProfile, ...EMOTIONAL_VOICES[emotion] };
            }

            if (dialogue) {
                jobs.push({ type: 'speech', text: dialogue, voiceProfile });
            }
        }
        lastIndex = regex.lastIndex;
    }

    const remainingText = text.substring(lastIndex).trim();
    if (remainingText) {
        jobs.push({ type: 'speech', text: remainingText, voiceProfile: NARRATOR_VOICE });
    }

    if (jobs.length === 0 && text.trim()) {
        jobs.push({ type: 'speech', text, voiceProfile: NARRATOR_VOICE });
    }

    return jobs;
};