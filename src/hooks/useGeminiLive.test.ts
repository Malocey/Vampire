import { getVoiceForText } from './useGeminiLive';
import { NARRATOR_VOICE, CHARACTER_VOICES, EMOTIONAL_VOICES } from '../config/voiceConfig';

describe('getVoiceForText', () => {
    it('should return the narrator voice by default', () => {
        const voice = getVoiceForText('This is a normal sentence.');
        expect(voice).toBe(NARRATOR_VOICE);
    });

    it('should return the correct voice for a character', () => {
        const voice = getVoiceForText('Amalia: Hello there.');
        expect(voice).toBe(CHARACTER_VOICES['Amalia']);
    });

    it('should return the correct voice for an emotional cue', () => {
        const voice = getVoiceForText('(Screaming) Get away!');
        expect(voice).toBe(EMOTIONAL_VOICES['Screaming']);
    });

    it('should prioritize emotional cues over character names', () => {
        const voice = getVoiceForText('Amalia: (Screaming) Get away!');
        expect(voice).toBe(EMOTIONAL_VOICES['Screaming']);
    });

    it('should be case-insensitive for character names', () => {
        const voice = getVoiceForText('amalia: Hello there.');
        expect(voice).toBe(CHARACTER_VOICES['Amalia']);
    });

    it('should be case-insensitive for emotional cues', () => {
        const voice = getVoiceForText('(screaming) Get away!');
        expect(voice).toBe(EMOTIONAL_VOICES['Screaming']);
    });
});