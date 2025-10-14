import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../../types';

interface LogPanelProps {
    transcript: TranscriptEntry[];
    story: string[];
    isGeneratingStory: boolean;
    canContinueStory: boolean;
    generateStory: () => void;
}

const HighlightedText = ({ text }: { text: string }) => {
    const parts = text.split(/(\*.*?\*)/g);
    return (
        <>
            {parts.map((part, i) =>
                part.startsWith('*') && part.endsWith('*') ? (
                    <span key={i} className="keyword-highlight">
                        {part.substring(1, part.length - 1)}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const LogPanel = ({ transcript, story, isGeneratingStory, canContinueStory, generateStory }: LogPanelProps) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, story]);

    return (
        <div className="game-view">
            <div className="log-content">
                {transcript.map((entry, index) => (
                    <div key={index} className={`log-entry-container ${entry.speaker}-message-container`}>
                        <p className={`log-entry ${entry.speaker}-message`}>
                            <HighlightedText text={entry.text} />
                        </p>
                    </div>
                ))}
                {story.length > 0 && (
                    <div className="chronicle-story">
                        <h3>Chronik</h3>
                        {story.map((chunk, index) => (
                            <p key={index}>
                                <HighlightedText text={chunk} />
                            </p>
                        ))}
                        {canContinueStory && (
                            <button onClick={generateStory} disabled={isGeneratingStory}>
                                {isGeneratingStory ? 'Generiere...' : 'Nächster Teil'}
                            </button>
                        )}
                        {!canContinueStory && <p>Ende der Geschichte.</p>}
                    </div>
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};