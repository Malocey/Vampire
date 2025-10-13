import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

const StatBar = ({ value, max, label, color, glowColor }: { value: number; max: number; label: string; color: string; glowColor: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const barStyle = {
        width: `${percentage}%`,
        backgroundColor: color,
        boxShadow: `0 0 8px ${glowColor}`,
    };
    return (
        <div className="hud-stat-bar">
            <div className="hud-bar-fill" style={barStyle}></div>
            <div className="hud-bar-text">
                <span>{label}</span>
                <span>{value} / {max}</span>
            </div>
        </div>
    );
};


export const GameHUD = () => {
    const { playerData } = usePlayerStore();

    if (!playerData) return null;

    const maxHealth = 50 + playerData.stats.endurance * 10;
    const maxBloodEssence = 100 + (playerData.bloodlineLevel - 1) * 20;

    return (
        <div className="game-hud-container">
            <div className="hud-left">
                <span className="hud-player-name">{playerData.name}</span>
                <span className="hud-player-level">LVL {playerData.level}</span>
            </div>
            <div className="hud-right">
                <StatBar 
                    value={playerData.currentHealth} 
                    max={maxHealth} 
                    label="HP" 
                    color="#c0392b" 
                    glowColor="#e74c3c"
                />
                <StatBar 
                    value={playerData.bloodEssence} 
                    max={maxBloodEssence} 
                    label="Essenz" 
                    color="#8e44ad" 
                    glowColor="#9b59b6"
                />
            </div>
        </div>
    );
};