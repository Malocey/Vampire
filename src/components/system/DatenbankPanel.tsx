import React, { useState, useMemo, useEffect } from 'react';
import { CodexEntry } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';

export const DatenbankPanel = () => {
    const { playerData } = usePlayerStore();
    const categories = useMemo(() => ['Personen', 'Orte', 'Fraktionen', 'Lore'], []);
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null);

    const filteredEntries = useMemo(() => {
        if (!playerData) return [];
        return playerData.codex.filter(entry => entry.category === activeCategory);
    }, [playerData, activeCategory]);

    useEffect(() => {
        setSelectedEntry(filteredEntries.find(e => e.unlocked) || null);
    }, [filteredEntries]);

    const handleSelectEntry = (entry: CodexEntry) => {
        if (entry.unlocked) {
            setSelectedEntry(entry);
        }
    };
    
    if (!playerData) return null;
    
    return (
        <div className="datenbank-panel">
            <div className="datenbank-sidebar">
                <div className="datenbank-categories">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)}
                            className={activeCategory === cat ? 'active' : ''}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="datenbank-entry-list">
                    {filteredEntries.map(entry => (
                        <div
                            key={entry.id}
                            className={`datenbank-entry ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
                            onClick={() => handleSelectEntry(entry)}
                        >
                            {entry.unlocked ? entry.title : '???' }
                        </div>
                    ))}
                </div>
            </div>
            <div className="datenbank-main-content">
                {selectedEntry ? (
                    <>
                        <h3>{selectedEntry.title}</h3>
                        <p>{selectedEntry.content}</p>
                    </>
                ) : (
                    <p>Wähle einen Eintrag, um Details anzuzeigen.</p>
                )}
            </div>
        </div>
    );
};