export interface PlayerStats {
    strength: number;
    agility: number;
    endurance: number;
    intelligence: number;
    charisma: number;
}

export type QuestStatus = 'active' | 'completed' | 'failed';
export type QuestType = 'main' | 'side';

export interface Quest {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    rewards: {
        xp: number;
        item?: string;
        essence?: number;
    };
    status: QuestStatus;
    type: QuestType;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    type: 'human' | 'nocturne' | 'sanguine';
    tier: number;
    cost: {
        skillPoints: number;
        bloodEssence?: number;
    };
    prerequisites: string[];
    unlocked: boolean;
    position: { x: number; y: number };
}

export type SkillTree = { [id: string]: Skill };

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
}

export interface PlayerData {
    name: string;
    level: number;
    stats: PlayerStats;
    bloodlineLevel: number;
    bloodlineName: string;
    bloodEssence: number;
    skillPoints: number;
    appearance: {
        hairStyle: string;
        hairColor: string;
        eyeColor: string;
        skinTone: string;
        clothing: string;
    };
    quests: Quest[];
    skillTree: SkillTree;
    inventory: InventoryItem[];
}

export type TabName = 'Charakter' | 'Quests' | 'Fähigkeiten' | 'Inventar' | 'Ruf';
export type GameState = 'intro' | 'creation' | 'game';

export interface TranscriptEntry {
    speaker: 'user' | 'model' | 'system';
    text: string;
}