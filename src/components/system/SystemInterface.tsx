import React, { useState } from 'react';
import { Type } from "@google/genai";
import { Quest, TabName, CodexEntry, MapLocation } from '../../types';
import { ai } from '../../config/api';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useApiStatusStore } from '../../store/useApiStatusStore';
import { isQuotaError } from '../../utils/errorUtils';
import { CharacterPanel } from './CharacterPanel';
import { QuestsPanel } from './QuestsPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { InventoryPanel } from './InventoryPanel';
import { ReputationPanel } from './ReputationPanel';
import { DatenbankPanel } from './DatenbankPanel';
import { KartePanel } from './KartePanel';
import { ChronikPanel } from './ChronikPanel';
import { ApiStatusPanel } from './ApiStatusPanel';


interface SystemInterfaceProps {
    isQuestLoading: boolean;
    setIsQuestLoading: (isLoading: boolean) => void;
    className?: string;
}

export const SystemInterface = ({ isQuestLoading, setIsQuestLoading, className }: SystemInterfaceProps) => {
    const { playerData, setPlayerData } = usePlayerStore();
    const { setModuleStatus } = useApiStatusStore();
    const [activeTab, setActiveTab] = useState<TabName>('Charakter');
    
    const handleGenerateQuest = async (questType: string) => {
        if (!playerData) return;

        setIsQuestLoading(true);

        const context = {
            name: playerData.name,
            level: playerData.level,
            stats: playerData.stats,
            bloodlineLevel: playerData.bloodlineLevel,
            inventory: playerData.inventory.map(i => i.name),
            activeQuests: playerData.quests.filter(q => q.status === 'active').map(q => q.title),
            completedQuests: playerData.quests.filter(q => q.status === 'completed').map(q => q.title),
            unlockedCodexTitles: playerData.codex.filter(c => c.unlocked).map(c => c.title),
            discoveredMapLocations: playerData.mapData.filter(m => m.discovered).map(m => m.name),
        };

        const prompt = `
            Du bist ein dynamischer Quest-Designer für das Rollenspiel 'Crimson Academy: The Awakened Blood'.
            Basierend auf dem aktuellen Spielfortschritt des Spielers, generiere eine neue, thematisch passende Nebenquest.

            Spielerkontext:
            ${JSON.stringify(context, null, 2)}

            Anforderungen:
            1.  **Quest-Typ:** Generiere eine Quest, die zum Typ "${questType}" passt (z.B. Sammelmission, Eliminierungsmission, Untersuchungsmission).
            2.  **Relevanz:** Die Quest muss sich organisch in die Welt einfügen und den Fortschritt des Spielers berücksichtigen. Vermeide Quests, die bereits abgeschlossenen ähneln. Der Titel sollte KEINE Präfixe wie '[Nebenquest]' enthalten.
            3.  **Welt-Erweiterung:** Wenn die Quest eine neue Person, einen neuen Ort oder neue Lore einführt, die der Spieler noch nicht kennt, erstelle entsprechende Datenbank- (Codex) und Karteneinträge.
            4.  **IDs:** Generiere einzigartige, sprechende IDs im Format \`präfix_name_in_snake_case\` (z.B., 'npc_john_doe', 'loc_alte_ruinen').
            5.  **Koordinaten:** Neue Orte benötigen plausible prozentuale Koordinaten (x, y zwischen 0 und 100), die nicht mit existierenden Orten kollidieren.
            6.  **Belohnungen:** Die Belohnungen (XP, Essenz, Items) müssen dem Level des Spielers angemessen sein.
            7.  **Format:** Halte dich strikt an das unten definierte JSON-Schema. Gib keine zusätzlichen Texte oder Erklärungen aus.
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
                            quest: {
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
                                    },
                                    locationId: { type: Type.STRING }
                                },
                                required: ['title', 'description', 'objectives', 'rewards']
                            },
                            newCodexEntries: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        category: { type: Type.STRING, enum: ['Personen', 'Orte', 'Fraktionen', 'Lore'] },
                                        content: { type: Type.STRING },
                                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ['id', 'title', 'category', 'content', 'keywords']
                                }
                            },
                            newMapLocations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        coordinates: {
                                            type: Type.OBJECT,
                                            properties: {
                                                x: { type: Type.NUMBER },
                                                y: { type: Type.NUMBER }
                                            },
                                            required: ['x', 'y']
                                        },
                                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ['id', 'name', 'description', 'coordinates', 'keywords']
                                }
                            }
                        },
                        required: ['quest']
                    }
                }
            });

            const generatedData = JSON.parse(response.text);
            const newPlayerData = JSON.parse(JSON.stringify(playerData));

            const questData = generatedData.quest;
            const newQuest: Quest = {
                id: `sq-${Date.now()}`,
                title: `[Nebenquest] ${questData.title}`,
                description: questData.description,
                objectives: questData.objectives.map((text: string) => ({ text, completed: false })),
                rewards: questData.rewards,
                status: 'active',
                type: 'side',
                locationId: questData.locationId,
            };
            newPlayerData.quests.push(newQuest);

            if (generatedData.newCodexEntries && generatedData.newCodexEntries.length > 0) {
                generatedData.newCodexEntries.forEach((entry: CodexEntry) => {
                    if (!newPlayerData.codex.some((e: CodexEntry) => e.id === entry.id)) {
                        newPlayerData.codex.push({ ...entry, unlocked: true });
                    }
                });
            }

            if (generatedData.newMapLocations && generatedData.newMapLocations.length > 0) {
                 generatedData.newMapLocations.forEach((loc: MapLocation) => {
                    if (!newPlayerData.mapData.some((m: MapLocation) => m.id === loc.id)) {
                        newPlayerData.mapData.push({ ...loc, discovered: true });
                    }
                });
            }

            setPlayerData(newPlayerData);

        } catch (error) {
            if (isQuotaError(error)) {
                setModuleStatus('quests', 'unavailable');
            } else {
                console.error("Error generating dynamic side quest:", error);
            }
        } finally {
            setIsQuestLoading(false);
        }
    };

    const renderPanel = () => {
        switch (activeTab) {
            case 'Charakter': return <CharacterPanel />;
            case 'Quests': return <QuestsPanel onGenerateQuest={handleGenerateQuest} isLoading={isQuestLoading} />;
            case 'Fähigkeiten': return <SkillTreePanel />;
            case 'Inventar': return <InventoryPanel />;
            case 'Datenbank': return <DatenbankPanel />;
            case 'Karte': return <KartePanel />;
            case 'Ruf': return <ReputationPanel />;
            case 'Chronik': return <ChronikPanel />;
            case 'Systemstatus': return <ApiStatusPanel />;
            default: return null;
        }
    };

    const tabs: TabName[] = ['Charakter', 'Quests', 'Fähigkeiten', 'Inventar', 'Datenbank', 'Karte', 'Ruf', 'Chronik', 'Systemstatus'];

    return (
        <div className={`system-interface ${className || ''}`}>
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