import { create } from 'zustand';
import { PlayerState, PlayerData, GameState, TranscriptEntry } from '../types';
import { saveGame, loadGame, deleteSave } from '../utils/saveLoad';
import { createDefaultPlayer } from '../utils/playerUtils';

export const usePlayerStore = create<PlayerState>((set, get) => ({
    playerData: null,
    gameState: 'intro',
    saveFileExists: false,
    isQuestLoading: false,

    setPlayerData: (data: PlayerData) => {
        set({ playerData: data });
        saveGame(data); // Autosave on every update
    },

    setGameState: (state: GameState) => set({ gameState: state }),
    
    setIsQuestLoading: (isLoading: boolean) => set({ isQuestLoading: isLoading }),

    updateTranscript: (updater) => {
        const currentData = get().playerData;
        if (currentData) {
            const newTranscript = updater(currentData.transcript || []);
            const newData = { ...currentData, transcript: newTranscript };
            set({ playerData: newData });
            saveGame(newData); // Also save on transcript update
        }
    },

    checkSaveFile: () => {
        const savedData = loadGame();
        set({ saveFileExists: !!savedData });
    },

    loadPlayer: () => {
        const data = loadGame();
        if (data) {
            set({ playerData: data, gameState: 'game', saveFileExists: true });
        }
    },
    
    createNewPlayer: (isQuickStart: boolean) => {
        deleteSave();
        if (isQuickStart) {
            const defaultPlayer = createDefaultPlayer();
            get().initializePlayer(defaultPlayer);
        } else {
            set({ playerData: null, saveFileExists: false, gameState: 'creation' });
        }
    },

    initializePlayer: (data: PlayerData) => {
        set({ playerData: data, gameState: 'game', saveFileExists: true });
        saveGame(data);
    },
}));