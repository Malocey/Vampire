import React from 'react';

interface HeaderProps {
    isMuted: boolean;
    onToggleMute: () => void;
    onSaveGame: () => void;
}

export const Header = ({ isMuted, onToggleMute, onSaveGame }: HeaderProps) => (
    <header>
        <span>Crimson Academy: Erwachtes Blut</span>
        <div className="header-controls">
            <button onClick={onSaveGame} className="save-btn" aria-label="Spiel speichern">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
            </button>
            <button onClick={onToggleMute} className="mute-btn" aria-label={isMuted ? 'Ton an' : 'Ton aus'}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isMuted ? (
                        <>
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                        </>
                    ) : (
                        <>
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </>
                    )}
                </svg>
            </button>
        </div>
    </header>
);