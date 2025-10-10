import React, { useState } from 'react';
import { PlayerData, PlayerStats } from '../../types';
import { BASE_STATS, ATTRIBUTE_POINTS_POOL, APPEARANCE_OPTIONS, APPEARANCE_LABELS, MAIN_QUESTS_DATA, SKILL_TREE_DATA } from '../../config/gameConfig';

interface CharacterCreationScreenProps {
    onCharacterCreate: (data: PlayerData) => void;
}

export const CharacterCreationScreen = ({ onCharacterCreate }: CharacterCreationScreenProps) => {
    const [name, setName] = useState('Kaelen');
    const [stats, setStats] = useState<PlayerStats>(BASE_STATS);
    const [points, setPoints] = useState(ATTRIBUTE_POINTS_POOL);
    const [appearance, setAppearance] = useState({
        hairStyle: APPEARANCE_OPTIONS.hairStyle[0],
        hairColor: APPEARANCE_OPTIONS.hairColor[0],
        eyeColor: APPEARANCE_OPTIONS.eyeColor[0],
        skinTone: APPEARANCE_OPTIONS.skinTone[0],
        clothing: APPEARANCE_OPTIONS.clothing[0],
    });

    const handleStatChange = (stat: keyof PlayerStats, amount: number) => {
        if (amount > 0 && points > 0) {
            setStats(prev => ({ ...prev, [stat]: prev[stat] + amount }));
            setPoints(p => p - 1);
        } else if (amount < 0 && stats[stat] > BASE_STATS[stat]) {
            setStats(prev => ({ ...prev, [stat]: prev[stat] + amount }));
            setPoints(p => p + 1);
        }
    };

    const handleFinalize = () => {
        const finalPlayerData: PlayerData = {
            name,
            level: 1,
            stats,
            bloodlineLevel: 1,
            bloodlineName: 'Frischling',
            bloodEssence: 100,
            skillPoints: 2, // Starting skill points
            appearance,
            quests: [MAIN_QUESTS_DATA[0]],
            skillTree: JSON.parse(JSON.stringify(SKILL_TREE_DATA)), // Deep copy
            inventory: [],
        };
        onCharacterCreate(finalPlayerData);
    };

    const isFinalizeDisabled = name.trim().length === 0 || points > 0;

    return (
        <div className="character-creation-container">
            <h2>Systemdiagnose: Identitätsrekonstruktion</h2>
            <div className="creation-layout">
                <div className="appearance-section">
                    <h3>Erscheinungsprotokoll</h3>
                    <div className="form-group">
                        <label htmlFor="charName">Bezeichnung:</label>
                        <input type="text" id="charName" value={name} onChange={e => setName(e.target.value)} placeholder="Gib dein Rufzeichen ein..." />
                    </div>
                    {Object.entries(APPEARANCE_OPTIONS).map(([key, options]) => (
                        <div className="form-group" key={key}>
                            <label>{APPEARANCE_LABELS[key]}:</label>
                             {key.includes('Color') || key.includes('Tone') ? (
                                <div className="color-swatches">
                                    {options.map(option => (
                                        <button key={option} className={`swatch ${appearance[key as keyof typeof appearance] === option ? 'active' : ''}`} style={{ backgroundColor: option }} onClick={() => setAppearance(prev => ({ ...prev, [key]: option }))} aria-label={option}></button>
                                    ))}
                                </div>
                            ) : (
                                <div className="button-group">
                                    {options.map(option => (
                                        <button key={option} className={appearance[key as keyof typeof appearance] === option ? 'active' : ''} onClick={() => setAppearance(prev => ({ ...prev, [key]: option }))}>{option}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="preview-section">
                    <h3>Visuelle Daten</h3>
                    <div className="character-preview" style={{ '--skin-tone': appearance.skinTone } as React.CSSProperties}>
                        <div className="sprite-base">
                            <div className="sprite-hair" style={{ backgroundColor: appearance.hairColor, boxShadow: `0 0 10px ${appearance.hairColor}` }}></div>
                            <div className="sprite-head">
                                <div className="sprite-eyes" style={{ backgroundColor: appearance.eyeColor, boxShadow: `0 0 8px ${appearance.eyeColor}` }}></div>
                            </div>
                            <div className="sprite-torso" style={{ backgroundColor: appearance.clothing === 'Militäruniform' ? '#4a535b' : '#3a4a78' }}></div>
                            <div className="sprite-legs"></div>
                        </div>
                        <div className="preview-labels">
                            <p><strong>Haarstil:</strong> {appearance.hairStyle}</p>
                            <p><strong>Kleidung:</strong> {appearance.clothing}</p>
                        </div>
                    </div>
                </div>
                <div className="stats-section">
                    <h3>Attributkalibrierung</h3>
                    <p>Verbleibende Punkte: <span className="points-counter">{points}</span></p>
                    {(Object.keys(stats) as Array<keyof PlayerStats>).map(stat => {
                        const value = stats[stat];
                        return (
                            <div className="stat-allocator" key={stat}>
                                <label>{stat.charAt(0).toUpperCase() + stat.slice(1)}</label>
                                <div className="allocator-controls">
                                    <button onClick={() => handleStatChange(stat, -1)} disabled={value <= BASE_STATS[stat]}>-</button>
                                    <span>{value}</span>
                                    <button onClick={() => handleStatChange(stat, 1)} disabled={points <= 0}>+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <button className="finalize-btn" onClick={handleFinalize} disabled={isFinalizeDisabled}>
                {isFinalizeDisabled ? (points > 0 ? `Verteile alle ${points} Punkte` : 'Gib eine Bezeichnung ein') : 'Rekonstruktion abschließen'}
            </button>
        </div>
    );
};