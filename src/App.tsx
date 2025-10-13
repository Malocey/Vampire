import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { useGeminiLive } from './hooks/useGeminiLive';
import { IntroScreen } from './components/intro';
import { CharacterCreationScreen } from './components/CharacterCreation';
import { Header } from './components/common';
import { LogPanel, MicrophoneControl, GameHUD } from './components/game';
import { SystemInterface } from './components/system';

const DynamicBackground = () => {
    const particles = Array.from({ length: 25 });

    return (
        <div className="particles-container" aria-hidden="true">
            {particles.map((_, i) => {
                const size = Math.random() * 2.5 + 1;
                const style = {
                    left: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${Math.random() * 20}s`,
                    animationDuration: `${Math.random() * 15 + 10}s`,
                };
                return <div key={i} className="particle" style={style}></div>;
            })}
        </div>
    );
};

const App = () => {
    const { gameState, playerData, checkSaveFile, isQuestLoading, setIsQuestLoading } = usePlayerStore();
    const [isSystemVisible, setIsSystemVisible] = React.useState(false);

    useEffect(() => {
        checkSaveFile();
    }, [checkSaveFile]);

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
        togglePause,
        selectSuggestion
    } = useGeminiLive();

    useEffect(() => {
        return () => {
            if (isConnected) {
                stopSession();
            }
        };
    }, [gameState, isConnected, stopSession]);

    if (gameState === 'intro') {
        return (
            <>
                <DynamicBackground />
                <IntroScreen />
            </>
        );
    }

    if (gameState === 'creation') {
        return (
            <>
                <DynamicBackground />
                <CharacterCreationScreen />
            </>
        );
    }

    if (gameState === 'game' && playerData) {
        return (
            <>
                <DynamicBackground />
                <div className="app-container">
                    <Header 
                        isMuted={isMuted} 
                        onToggleMute={toggleMute} 
                        onToggleSystem={() => setIsSystemVisible(!isSystemVisible)}
                    />
                    <div className="main-content">
                        <LogPanel transcript={transcript} />
                        <GameHUD />
                    </div>
                    <MicrophoneControl 
                        isConnected={isConnected}
                        isListening={isListening}
                        isPaused={isPaused}
                        suggestions={suggestions}
                        startSession={startSession}
                        stopSession={stopSession}
                        togglePause={togglePause}
                        selectSuggestion={selectSuggestion}
                    />
                    <SystemInterface 
                        isQuestLoading={isQuestLoading} 
                        setIsQuestLoading={setIsQuestLoading}
                        className={isSystemVisible ? 'visible' : ''}
                    />
                </div>
            </>
        );
    }

    return null;
};

export default App;