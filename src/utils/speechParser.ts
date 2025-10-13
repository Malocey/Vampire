import { VoiceProfile } from '../types';
import { NARRATOR_VOICE, CHARACTER_VOICES, EMOTIONAL_VOICES } from '../config/voiceConfig';

export type SpeechJob =
    | { type: 'speech'; text: string; voiceProfile: VoiceProfile }
    | { type: 'sfx'; effect: string }
    | { type: 'music'; track: string };

export const parseSpeechCommands = (text: string): SpeechJob[] => {
    const jobs: SpeechJob[] = [];
    const regex = /\((.*?)\)\s*(.*?)(?=\s*\(|$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const command = match[1].trim();
        const dialogue = match[2].trim();

        if (command.startsWith('sound effect:')) {
            const effect = command.replace('sound effect:', '').trim();
            jobs.push({ type: 'sfx', effect });
            if (dialogue) jobs.push({ type: 'speech', text: dialogue, voiceProfile: NARRATOR_VOICE });
            continue;
        }

        if (command.startsWith('music:')) {
            const track = command.replace('music:', '').trim();
            jobs.push({ type: 'music', track });
            if (dialogue) jobs.push({ type: 'speech', text: dialogue, voiceProfile: NARRATOR_VOICE });
            continue;
        }

        const [speaker, ...emotionParts] = command.split(' stimme ');
        const emotion = emotionParts.join(' ').trim();

        let voiceProfile: VoiceProfile = NARRATOR_VOICE;

        if (CHARACTER_VOICES[speaker]) {
            voiceProfile = CHARACTER_VOICES[speaker];
        }

        if (emotion && EMOTIONAL_VOICES[emotion]) {
            voiceProfile = { ...voiceProfile, ...EMOTIONAL_VOICES[emotion] };
        }

        jobs.push({ type: 'speech', text: dialogue, voiceProfile });
    }

    if (jobs.length === 0 && text.trim()) {
        jobs.push({ type: 'speech', text, voiceProfile: NARRATOR_VOICE });
    }

    return jobs;
};