import { VoiceProfile } from '../types';

export const NARRATOR_VOICE: VoiceProfile = {
    voiceName: 'Zephyr',
    seed: 1234,
    temperature: 0.7,
};

export const CHARACTER_VOICES: Record<string, VoiceProfile> = {
    'Amalia': { voiceName: 'Luna', seed: 2345, temperature: 0.8 },
    'Corvus': { voiceName: 'Onyx', seed: 3456, temperature: 0.6 },
    'Seraphina': { voiceName: 'Nova', seed: 4567, temperature: 0.9 },
    'Lysander': { voiceName: 'Echo', seed: 5678, temperature: 0.7 },
    'Lilith': { voiceName: 'Comet', seed: 6789, temperature: 0.8 },
    'Kaelen': { voiceName: 'Jupiter', seed: 7890, temperature: 0.7 },
    'Welt': { voiceName: 'Zephyr', seed: 1234, temperature: 0.7 },
};

export const EMOTIONAL_VOICES: Record<string, Partial<VoiceProfile>> = {
    'Screaming': { temperature: 1.0 },
    'Whispering': { temperature: 0.4 },
    'Excited': { temperature: 0.9 },
    'Sad': { temperature: 0.5 },
    'Angry': { temperature: 0.8 },
};