import { PlayerData } from '../types';

const SAVE_KEY = 'vampireAcademy.saveData';

export const saveGame = (playerData: PlayerData): void => {
    try {
        const dataString = JSON.stringify(playerData);
        localStorage.setItem(SAVE_KEY, dataString);
    } catch (error) {
        console.error("Failed to save game:", error);
    }
};

export const loadGame = (): PlayerData | null => {
    try {
        const dataString = localStorage.getItem(SAVE_KEY);
        if (!dataString) {
            return null;
        }
        return JSON.parse(dataString) as PlayerData;
    } catch (error) {
        console.error("Failed to load game:", error);
        return null;
    }
};

export const deleteSave = (): void => {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (error) {
        console.error("Failed to delete save:", error);
    }
};
