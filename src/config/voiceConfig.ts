import { PrebuiltVoice } from '../types';

export const NARRATOR_VOICE: PrebuiltVoice = 'Zephyr';

export const CHARACTER_VOICES: Record<string, PrebuiltVoice> = {
    'Amalia': 'Luna',
    'Corvus': 'Onyx',
    'Seraphina': 'Nova',
    'Lysander': 'Echo',
    'Lilith': 'Comet',
    'Kaelen': 'Jupiter',
    'Welt': 'Zephyr',
};

export const EMOTIONAL_VOICES: Record<string, PrebuiltVoice> = {
    'Screaming': 'Shimmer',
    'Whispering': 'Echo',
    'Excited': 'Nova',
    'Sad': 'WaveNet-D',
    'Angry': 'Onyx',
};

export const ALL_AVAILABLE_VOICES: PrebuiltVoice[] = [
    "Echo", "Onyx", "Nova", "Shimmer", "Luna", "Comet", "Jupiter",
    "WaveNet-A", "WaveNet-B", "WaveNet-C", "WaveNet-D", "WaveNet-E",
    "WaveNet-F", "WaveNet-G", "WaveNet-H", "WaveNet-I", "WaveNet-J",
    "Zephyr"
];