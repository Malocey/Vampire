import React, { useState } from 'react';
import { Type } from "@google/genai";
import { Quest, TabName, CodexEntry, MapLocation } from '../../types';
import { ai } from '../../config/api';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useApiStatusStore } from '../../store/useApiStatusStore';
import { isQuotaError } from '../../utils/errorUtils';
import { useQuestGenerator } from '../../hooks/useQuestGenerator';
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
    const { generateQuest } = useQuestGenerator();
    const [activeTab, setActiveTab] = useState<TabName>('Charakter');
    
    const renderPanel = () => {
        switch (activeTab) {
            case 'Charakter': return <CharacterPanel />;
            case 'Quests': return <QuestsPanel onGenerateQuest={generateQuest} isLoading={isQuestLoading} />;
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