// Fix: Removed an invalid import for 'LiveSession' which is not exported by '@google/genai'.

export interface PlayerStats {
    strength: number;
    agility: number;
    endurance: number;
    intelligence: number;
    charisma: number;
}

export interface QuestObjective {
    text: string;
    completed: boolean;
    trigger?: string; // e.g., "visit:loc_id", "obtain:item_id", "talk:npc_id"
}

export type QuestStatus = 'active' | 'completed' | 'failed';
export type QuestType = 'main' | 'side';

export interface Quest {
    id: string;
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: {
        xp: number;
        item?: string;
        essence?: number;
    };
    status: QuestStatus;
    type: QuestType;
    locationId?: string; // Link to a map location
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

export type PrebuiltVoice =
    | 'Echo' | 'Onyx' | 'Nova' | 'Shimmer' | 'Luna' | 'Comet' | 'Jupiter'
    | 'WaveNet-A' | 'WaveNet-B' | 'WaveNet-C' | 'WaveNet-D' | 'WaveNet-E'
    | 'WaveNet-F' | 'WaveNet-G' | 'WaveNet-H' | 'WaveNet-I' | 'WaveNet-J'
    | 'Zephyr';

export interface CodexEntry {
    id: string;
    title: string;
    category: 'Personen' | 'Orte' | 'Fraktionen' | 'Lore';
    content: string;
    keywords: string[];
    unlocked: boolean;
    voice?: PrebuiltVoice;
}

export interface MapLocation {
    id: string;
    name: string;
    description: string;
    coordinates: { x: number; y: number }; // as percentages
    keywords: string[];
    discovered: boolean;
}

export interface PlayerData {
    name: string;
    level: number;
    currentHealth: number;
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
    codex: CodexEntry[];
    mapData: MapLocation[];
    transcript: TranscriptEntry[];
    npcMemories: { [npcId: string]: string; };
}

export type TabName = 'Charakter' | 'Quests' | 'Fähigkeiten' | 'Inventar' | 'Datenbank' | 'Karte' | 'Ruf' | 'Chronik' | 'Systemstatus';
export type GameState = 'intro' | 'creation' | 'game';

export interface TranscriptEntry {
    speaker: 'user' | 'model' | 'system';
    text: string;
}

export type SuggestionCategory = 'Untersuchung' | 'Dialog' | 'Aktion';

export interface CategorizedSuggestion {
    text: string;
    category: SuggestionCategory;
}

// Zustand Player Store Type
export interface PlayerState {
    playerData: PlayerData | null;
    gameState: GameState;
    saveFileExists: boolean;
    isQuestLoading: boolean;
    setPlayerData: (data: PlayerData) => void;
    setGameState: (state: GameState) => void;
    setIsQuestLoading: (isLoading: boolean) => void;
    checkSaveFile: () => void;
    loadPlayer: () => void;
    createNewPlayer: (isQuickStart: boolean) => void;
    initializePlayer: (data: PlayerData) => void;
    updateTranscript: (updater: (prev: TranscriptEntry[]) => TranscriptEntry[]) => void;
}

// Zustand API Status Store Types
export const API_MODULES = {
    live: "Echtzeit-Sprachmodul",
    narrative: "Narrativ-Modul",
    suggestions: "Vorschlags-Modul",
    memory: "NSC-Gedächtnismodul",
    quests: "Quest-Generator",
    chronicle: "Chronik-Generator",
} as const;

export type ApiModule = keyof typeof API_MODULES;
export type ApiStatus = 'operational' | 'degraded' | 'unavailable';

export interface ApiStatusState {
    status: Record<ApiModule, ApiStatus>;
    setModuleStatus: (module: ApiModule, status: ApiStatus) => void;
    resetAllStatus: () => void;
}
