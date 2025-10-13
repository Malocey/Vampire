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

export const exportSaveToFile = (): void => {
    const dataString = localStorage.getItem(SAVE_KEY);
    if (!dataString) {
        alert("Keine Speicherdaten zum Exportieren gefunden.");
        return;
    }
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vampire-save-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importSaveFromFile = (file: File): Promise<PlayerData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const dataString = event.target?.result as string;
                const playerData = JSON.parse(dataString) as PlayerData;
                // Basic validation
                if (playerData && playerData.name && playerData.stats) {
                    resolve(playerData);
                } else {
                    reject(new Error("Ungültige Speicherdatei."));
                }
            } catch (error) {
                reject(new Error("Fehler beim Parsen der Speicherdatei."));
            }
        };
        reader.onerror = (error) => {
            reject(new Error("Fehler beim Lesen der Datei."));
        };
        reader.readAsText(file);
    });
};
