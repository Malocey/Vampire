import { PlayerData } from '../types';
import { 
    BASE_STATS, 
    APPEARANCE_OPTIONS, 
    MAIN_QUESTS_DATA, 
    SKILL_TREE_DATA 
} from '../config/gameConfig';
import { INITIAL_CODEX_DATA } from '../config/codexData';
import { INITIAL_MAP_DATA } from '../config/mapData';

export const createDefaultPlayer = (): PlayerData => {
    const stats = { ...BASE_STATS };
    const defaultPlayer: PlayerData = {
        name: 'Kaelen',
        level: 1,
        stats: stats,
        currentHealth: 50 + stats.endurance * 10,
        bloodlineLevel: 1,
        bloodlineName: 'Frischling',
        bloodEssence: 100,
        skillPoints: 2,
        appearance: {
            hairStyle: APPEARANCE_OPTIONS.hairStyle[0],
            hairColor: APPEARANCE_OPTIONS.hairColor[0],
            eyeColor: APPEARANCE_OPTIONS.eyeColor[0],
            skinTone: APPEARANCE_OPTIONS.skinTone[0],
            clothing: APPEARANCE_OPTIONS.clothing[0],
        },
        quests: JSON.parse(JSON.stringify([MAIN_QUESTS_DATA[0]])),
        skillTree: JSON.parse(JSON.stringify(SKILL_TREE_DATA)), // Deep copy
        inventory: [],
        codex: JSON.parse(JSON.stringify(INITIAL_CODEX_DATA)),
        mapData: JSON.parse(JSON.stringify(INITIAL_MAP_DATA)),
        transcript: [{
            speaker: 'system',
            text: 'System initialisiert. Willkommen in der Crimson Academy.'
        }],
        npcMemories: {},
    };
    return defaultPlayer;
};