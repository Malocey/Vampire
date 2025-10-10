import React from 'react';
import { PlayerData } from '../../types';

interface CharacterPanelProps {
    data: PlayerData;
}

export const CharacterPanel = ({ data }: CharacterPanelProps) => (
    <div className="character-panel">
        <div className="character-info">
            <h3>Personalakte</h3>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Level:</strong> {data.level}</p>
            <p><strong>Blutessenz:</strong> {data.bloodEssence}</p>
            <p><strong>Fähigkeitspunkte:</strong> {data.skillPoints}</p>
        </div>
        <div className="stats-info">
            <h3>Kernattribute</h3>
            {Object.entries(data.stats).map(([stat, value]) => (
                <div className="stat-item" key={stat}>
                    <span>{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                    <span>{value}</span>
                </div>
            ))}
        </div>
        <div className="bloodline-info">
            <h3>Vampir-Blutlinie</h3>
            <p><strong>Rang:</strong> {data.bloodlineName} (Level {data.bloodlineLevel})</p>
        </div>
    </div>
);
