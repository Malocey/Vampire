import React, { useState } from 'react';
import { Quest, QuestStatus } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';

interface QuestsPanelProps {
    onGenerateQuest: (type: string) => void;
    isLoading: boolean;
}

export const QuestsPanel = ({ onGenerateQuest, isLoading }: QuestsPanelProps) => {
    const { playerData } = usePlayerStore();
    const quests = playerData?.quests || [];
    
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(quests[0]?.id || null);
    const [activeFilter, setActiveFilter] = useState<QuestStatus | 'board'>('active');

    const selectedQuest = quests.find(q => q.id === selectedQuestId);
    const filteredQuests = quests.filter(q => q.status === activeFilter);

    const renderQuestDetails = (quest: Quest) => (
        <div className="quest-details-view">
            <h3>{quest.title}</h3>
            <p className="quest-description">{quest.description}</p>
            <div className="quest-objectives">
                <h4>Ziele:</h4>
                <ul>
                    {quest.objectives.map((obj, i) => (
                        <li key={i} className={obj.completed ? 'completed' : ''}>
                            {obj.text}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="quest-rewards">
                <h4>Belohnungen:</h4>
                <p>
                    {quest.rewards.xp} XP
                    {quest.rewards.item && `, ${quest.rewards.item}`}
                    {quest.rewards.essence && `, ${quest.rewards.essence} Blutessenz`}
                </p>
            </div>
        </div>
    );
    
    const renderMissionBoard = () => (
        <div className="mission-board-view">
            <h3>Missionstafel</h3>
            <p>Das System kann wiederholbare Nebenmissionen zur Ressourcengewinnung generieren.</p>
            <div className="mission-buttons">
                <button onClick={() => onGenerateQuest()} disabled={isLoading}>{isLoading ? 'Generiere...' : 'Neue Quest generieren'}</button>
            </div>
        </div>
    );
    
    if (!playerData) return null;

    return (
        <div className="quests-panel">
            <div className="quest-sidebar">
                <div className="quest-filters">
                    <button onClick={() => setActiveFilter('active')} className={activeFilter === 'active' ? 'active' : ''}>Aktiv</button>
                    <button onClick={() => setActiveFilter('completed')} className={activeFilter === 'completed' ? 'active' : ''}>Abgeschlossen</button>
                    <button onClick={() => setActiveFilter('board')} className={activeFilter === 'board' ? 'active' : ''}>Missionstafel</button>
                </div>
                <div className="quest-list">
                    {activeFilter !== 'board' && filteredQuests.map(quest => (
                        <div 
                            key={quest.id} 
                            className={`quest-entry ${quest.id === selectedQuestId ? 'selected' : ''} ${quest.type === 'main' ? 'main-quest' : 'side-quest'}`}
                            onClick={() => setSelectedQuestId(quest.id)}
                        >
                            {quest.title}
                        </div>
                    ))}
                </div>
            </div>
            <div className="quest-main-content">
                {activeFilter === 'board' 
                    ? renderMissionBoard()
                    : selectedQuest ? renderQuestDetails(selectedQuest) : <p>Wähle eine Quest aus, um Details anzuzeigen.</p>}
            </div>
        </div>
    );
};