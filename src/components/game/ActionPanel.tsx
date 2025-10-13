import React from 'react';
import { CategorizedSuggestion, SuggestionCategory } from '../../types';

interface MicrophoneControlProps {
    isConnected: boolean;
    isListening: boolean;
    isPaused: boolean;
    suggestions: CategorizedSuggestion[];
    startSession: () => void;
    stopSession: () => void;
    togglePause: () => void;
    selectSuggestion: (text: string) => void;
}


const SuggestionIcon = ({ category }: { category: SuggestionCategory }) => {
    switch (category) {
        case 'Untersuchung':
            return (
                <svg className="suggestion-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            );
        case 'Dialog':
            return (
                <svg className="suggestion-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            );
        case 'Aktion':
            return (
                <svg className="suggestion-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            );
        default:
            return null;
    }
}


export const MicrophoneControl = ({ isConnected, isListening, isPaused, suggestions, startSession, stopSession, togglePause, selectSuggestion }: MicrophoneControlProps) => {
    const [textInput, setTextInput] = React.useState('');

    const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(event.target.value);
    };

    const handleSendClick = () => {
        if (textInput.trim() !== '') {
            selectSuggestion(textInput.trim());
            setTextInput('');
        }
    };

    const handleMainButtonClick = () => {
        if (isConnected) {
            togglePause();
        } else {
            startSession();
        }
    };

    const getStatusContent = () => {
        if (!isConnected) {
            return <span className="status-disconnected">Getrennt</span>;
        }
        if (isPaused) {
            return <span className="status-paused">Pausiert</span>;
        }
        if (isListening) {
            return <span className="status-listening">Höre zu...</span>;
        }
        return <span className="status-speaking">KI spricht...</span>;
    };
    
    const getMainButtonContent = () => {
        if (!isConnected) {
            return {
                text: 'Sitzung starten',
                aria: 'Sitzung starten',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line>
                    </svg>
                )
            };
        }
        if (isPaused) {
            return {
                text: 'Fortsetzen',
                aria: 'Sitzung fortsetzen',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                )
            };
        }
        return {
            text: 'Pausieren',
            aria: 'Sitzung pausieren',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            )
        };
    };

    const { text, aria, icon } = getMainButtonContent();
    const mainButtonClasses = [
        'session-btn',
        isConnected && 'connected',
        isListening && 'listening',
        isPaused && 'paused'
    ].filter(Boolean).join(' ');

    return (
        <div className="action-panel">
            <div className="suggestions-panel">
                {isConnected && isListening && suggestions.length > 0 && (
                     <>
                        <h4 className="suggestions-title">Was du sagen könntest:</h4>
                        <div className="suggestions-buttons">
                            {suggestions.map((suggestion, index) => (
                                <button 
                                    key={index} 
                                    className="suggestion-btn" 
                                    title={suggestion.category}
                                    onClick={() => selectSuggestion(suggestion.text)}
                                    disabled={!isListening}
                                >
                                    <SuggestionIcon category={suggestion.category} />
                                    {suggestion.text}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <div className="microphone-control">
                 <button 
                    onClick={handleMainButtonClick} 
                    className={mainButtonClasses}
                    aria-label={aria}
                >
                    {icon}
                    {text}
                </button>
                {isConnected && (
                    <button onClick={stopSession} className="disconnect-btn" aria-label="Sitzung beenden">
                        Trennen
                    </button>
                )}
                <p className="connection-status">
                    Status: {getStatusContent()}
                </p>
                <div className="text-input-container">
                    <input
                        type="text"
                        value={textInput}
                        onChange={handleTextInputChange}
                        placeholder="Text eingeben..."
                    />
                    <button onClick={handleSendClick}>Senden</button>
                </div>
            </div>
        </div>
    );
};