import React, { useState, useEffect } from 'react';
import { GameState, PlayerData } from './types';
import { useGeminiLive } from './hooks/useGeminiLive';
import { saveGame, loadGame, deleteSave } from './utils/saveLoad';
import { IntroScreen } from './components/intro';
import { CharacterCreationScreen } from './components/CharacterCreation';
import { Header } from './components/common';
import { LogPanel, MicrophoneControl } from './components/game';
import { SystemInterface } from './components/system';

const App = () => {
    const [gameState, setGameState] = useState<GameState>('intro');
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [saveFileExists, setSaveFileExists] = useState(false);
    const [isQuestLoading, setIsQuestLoading] = useState(false);
    
    useEffect(() => {
        const savedData = loadGame();
        if (savedData) {
            setSaveFileExists(true);
        }
    }, []);

    const { 
        isConnected, 
        isMuted,
        isListening,
        isPaused,
        transcript, 
        suggestions,
        startSession, 
        stopSession,
        toggleMute,
        togglePause
    } = useGeminiLive();

    useEffect(() => {
        // Automatically stop session if player data/game state changes
        return () => {
            if (isConnected) {
                stopSession();
            }
        };
    }, [playerData, gameState, isConnected, stopSession]);

    const handleCharacterCreation = (data: PlayerData) => {
        setPlayerData(data);
        setGameState('game');
        saveGame(data); // First save
        setSaveFileExists(true);
    };
    
    const handleUpdatePlayerData = (data: PlayerData) => {
        setPlayerData(data);
        saveGame(data); // Autosave on any update
    };

    const handleSaveGame = () => {
        if (playerData) {
            saveGame(playerData);
            // Here you could add a toast/notification to confirm the save
        }
    };

    const handleLoadGame = () => {
        const data = loadGame();
        if (data) {
            setPlayerData(data);
            setGameState('game');
        }
    };

    const handleNewGame = () => {
        // Confirmation is handled in the IntroScreen component
        deleteSave();
        setSaveFileExists(false);
        setPlayerData(null); // Clear old data
        setGameState('creation');
    };

    if (gameState === 'intro') {
        return <IntroScreen 
            onFinish={() => setGameState('creation')} 
            saveFileExists={saveFileExists}
            onLoadGame={handleLoadGame}
            onNewGame={handleNewGame}
        />;
    }

    if (gameState === 'creation') {
        return <CharacterCreationScreen onCharacterCreate={handleCharacterCreation} />;
    }

    if (playerData) {
        return (
            <div className="app-container">
                <Header isMuted={isMuted} onToggleMute={toggleMute} onSaveGame={handleSaveGame} />
                <div className="main-content">
                    <LogPanel transcript={transcript} />
                    <MicrophoneControl 
                        isConnected={isConnected}
                        isListening={isListening}
                        isPaused={isPaused}
                        suggestions={suggestions}
                        startSession={startSession}
                        stopSession={stopSession}
                        togglePause={togglePause}
                    />
                </div>
                <SystemInterface 
                    playerData={playerData} 
                    onUpdatePlayerData={handleUpdatePlayerData} 
                    isQuestLoading={isQuestLoading} 
                    setIsQuestLoading={setIsQuestLoading}
                />
            </div>
        );
    }

    return null; // Should not be reached
};

export default App;