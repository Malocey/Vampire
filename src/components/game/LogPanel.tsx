import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../../types';

interface LogPanelProps {
    transcript: TranscriptEntry[];
}

export const LogPanel = ({ transcript }: LogPanelProps) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const getEntryClass = (speaker: TranscriptEntry['speaker']) => {
        switch (speaker) {
            case 'user':
                return 'player-action';
            case 'model':
                return 'model-response';
            case 'system':
                return 'system-message';
            default:
                return '';
        }
    };

     const getContainerClass = (speaker: TranscriptEntry['speaker']) => {
        return speaker === 'user' ? 'player-action-container' : '';
    };

    return (
        <div className="game-view log-panel">
            <div className="log-content">
                {transcript.map((entry, index) => (
                     <div key={index} className={`log-entry-container ${getContainerClass(entry.speaker)}`}>
                        <p className={`log-entry ${getEntryClass(entry.speaker)}`}>
                           {entry.speaker === 'user' && '> '}{entry.text}
                        </p>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};
