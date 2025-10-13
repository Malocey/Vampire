import { VoiceProfile } from '../types';
import { NARRATOR_VOICE, CHARACTER_VOICES, EMOTIONAL_VOICES } from '../config/voiceConfig';

export interface SpeechJob {
    text: string;
    voiceProfile: VoiceProfile;
}

export const parseSpeechCommands = (text: string): SpeechJob[] => {
    const jobs: SpeechJob[] = [];
    const regex = /\((.*?)\)\s*(.*?)(?=\s*\(|$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const command = match[1].trim();
        const dialogue = match[2].trim();

        const [speaker, ...emotionParts] = command.split(' stimme ');
        const emotion = emotionParts.join(' ').trim();

        let voiceProfile: VoiceProfile = NARRATOR_VOICE;

        if (CHARACTER_VOICES[speaker]) {
            voiceProfile = CHARACTER_VOICES[speaker];
        }

        if (emotion && EMOTIONAL_VOICES[emotion]) {
            voiceProfile = { ...voiceProfile, ...EMOTIONAL_VOICES[emotion] };
        }

        jobs.push({ text: dialogue, voiceProfile });
    }

    if (jobs.length === 0 && text.trim()) {
        jobs.push({ text, voiceProfile: NARRATOR_VOICE });
    }

    return jobs;
};