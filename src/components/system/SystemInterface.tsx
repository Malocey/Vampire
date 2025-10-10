import React, { useState } from 'react';
import { Type } from "@google/genai";
import { PlayerData, Quest, TabName } from '../../types';
import { ai } from '../../config/api';
import { CharacterPanel } from './CharacterPanel';
import { QuestsPanel } from './QuestsPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { InventoryPanel } from './InventoryPanel';
import { ReputationPanel } from './ReputationPanel';

interface SystemInterfaceProps {
    playerData: PlayerData;
    onUpdatePlayerData: (data: PlayerData) => void;
    isQuestLoading: boolean;
    setIsQuestLoading: (isLoading: boolean) => void;
}

export const SystemInterface = ({ playerData, onUpdatePlayerData, isQuestLoading, setIsQuestLoading }: SystemInterfaceProps) => {
    const [activeTab, setActiveTab] = useState<TabName>('Charakter');
    
    const handleGenerateQuest = async (questType: string) => {
        setIsQuestLoading(true);
        const questPools = {
            locations: ['Bibliotheksarchive', 'Trainingsarenen', 'Untere Ebenen', 'Medizinische Abteilung', 'Stadtsektor 3'],
            npcs: ['Ausbilder Graves', 'Kadettin Anya', 'Archivar Lyra', 'Sicherheitschef Thorne', 'Dr. Alistair'],
            items: ['Datenchip', 'Blutprobe', 'Antikes Arteakt', 'Sicherheits-Keycard', 'Synthetisches Blutpaket'],
            enemies: ['Korrumpiertes Sicherheitssystem', 'Abtrünniger Vampir', 'Untergrund-Bestie', 'Gepanzerte Wache']
        };

        const prompt = `
            Du bist ein Quest-Generator für das Text-Rollenspiel 'Crimson Academy: The Awakened Blood'.
            Der Spieler ist auf Level ${playerData.level}.
            Generiere eine einzelne, wiederholbare Nebenquest basierend auf den folgenden Parametern.
            Die Quest sollte in das dunkle, futuristische Vampir-Thema passen.

            Quest-Typ: ${questType}
            Verfügbare Datenpools zur Inspiration:
            - Orte: ${questPools.locations.join(', ')}
            - NPCs: ${questPools.npcs.join(', ')}
            - Gegenstände: ${questPools.items.join(', ')}
            - Gegner: ${questPools.enemies.join(', ')}
            
            Die Beschreibung und Ziele sollten kurz sein (jeweils 1-2 Sätze). Der Titel sollte thematisch sein. Die Belohnungen sollten dem Spielerlevel angemessen sein.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                            rewards: {
                                type: Type.OBJECT,
                                properties: {
                                    xp: { type: Type.INTEGER },
                                    item: { type: Type.STRING },
                                    essence: { type: Type.INTEGER }
                                },
                                required: ['xp']
                            }
                        },
                        required: ['title', 'description', 'objectives', 'rewards']
                    }
                }
            });

            const generatedData = JSON.parse(response.text);
            const newQuest: Quest = {
                id: `sq-${Date.now()}`,
                ...generatedData,
                status: 'active',
                type: 'side',
            };
            
            onUpdatePlayerData({ ...playerData, quests: [...playerData.quests, newQuest] });

        } catch (error) {
            console.error("Error generating side quest:", error);
        } finally {
            setIsQuestLoading(false);
        }
    };

    const renderPanel = () => {
        switch (activeTab) {
            case 'Charakter':
                return <CharacterPanel data={playerData} />;
            case 'Quests':
                return <QuestsPanel quests={playerData.quests} onGenerateQuest={handleGenerateQuest} isLoading={isQuestLoading} />;
            case 'Fähigkeiten':
                return <SkillTreePanel playerData={playerData} onUpdatePlayerData={onUpdatePlayerData} />;
            case 'Inventar':
                return <InventoryPanel playerData={playerData} />;
            case 'Ruf':
                return <ReputationPanel />;
            default:
                return null;
        }
    };

    const tabs: TabName[] = ['Charakter', 'Quests', 'Fähigkeiten', 'Inventar', 'Ruf'];

    return (
        <div className="system-interface">
            <div className="tabs">
                {tabs.map(tabName => (
                    <button
                        key={tabName}
                        className={`tab ${activeTab === tabName ? 'active' : ''}`}
                        onClick={() => setActiveTab(tabName)}
                        aria-pressed={activeTab === tabName}
                    >
                        {tabName}
                    </button>
                ))}
            </div>
            <div className="panel-content">
                {renderPanel()}
            </div>
        </div>
    );
};