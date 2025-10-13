import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TranscriptEntry, CodexEntry } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';

interface Keyword {
    name: string;
    description: string;
    type: string;
}

const codexEntryToKeyword = (entry: CodexEntry): Keyword => ({
    name: entry.title,
    description: entry.content,
    type: entry.category,
});

interface LogPanelProps {
    transcript: TranscriptEntry[];
}

export const LogPanel = ({ transcript }: LogPanelProps) => {
    const { playerData } = usePlayerStore();
    const logEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; top: number; left: number } | null>(null);

    const interactiveContent = useMemo(() => {
        if (!playerData) return { codexById: {}, passiveKeywords: [] };

        const codexById: { [id: string]: CodexEntry } = {};
        playerData.codex.forEach(entry => {
            codexById[entry.id] = entry;
        });

        const passiveKeywords: Keyword[] = [
            ...playerData.inventory.map(item => ({ name: item.name, description: item.description, type: 'Item' })),
            ...playerData.quests.map(quest => ({ name: quest.title.replace(/\[.*?\]\s/,''), description: quest.description, type: 'Quest' }))
        ].filter(k => k.name);
        
        return { codexById, passiveKeywords };
    }, [playerData]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleKeywordHover = (keyword: Keyword, target: HTMLElement) => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        if (!containerRect) return;

        const tooltipContent = (
            <>
                <h4>{keyword.name} <span>({keyword.type})</span></h4>
                <p>{keyword.description}</p>
            </>
        );

        setTooltip({
            content: tooltipContent,
            top: targetRect.top - containerRect.top - 10,
            left: targetRect.left - containerRect.left + (targetRect.width / 2),
        });
    };

    const handleKeywordLeave = () => {
        setTooltip(null);
    };

    const renderTextWithPassiveHighlight = (text: string) => {
        if (!interactiveContent.passiveKeywords.length) {
            return text;
        }
        const regex = new RegExp(`\\b(${interactiveContent.passiveKeywords.map(k => k.name).join('|')})\\b`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) => {
            const keyword = interactiveContent.passiveKeywords.find(k => k.name.toLowerCase() === part.toLowerCase());
            if (keyword) {
                return (
                    <span
                        key={index}
                        className="keyword-highlight"
                        onMouseEnter={(e) => handleKeywordHover(keyword, e.currentTarget)}
                        onMouseLeave={handleKeywordLeave}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const parseAndRenderModelText = (text: string) => {
        const parts: (string | React.ReactElement)[] = [];
        const tagRegex = /(\[h:[\w_-]+].*?\[\/h\])/g;
        const segments = text.split(tagRegex);

        segments.forEach((segment, index) => {
            const tagMatch = segment.match(/\[h:([\w_-]+)\](.*?)\[\/h\]/);
            if (tagMatch) {
                const codexId = tagMatch[1];
                const innerText = tagMatch[2];
                const codexEntry = interactiveContent.codexById[codexId];
                
                if (codexEntry?.unlocked) {
                    parts.push(
                        <span
                            key={`${index}-${codexId}`}
                            className="lore-link"
                            onMouseEnter={(e) => handleKeywordHover(codexEntryToKeyword(codexEntry), e.currentTarget)}
                            onMouseLeave={handleKeywordLeave}
                        >
                            {innerText}
                        </span>
                    );
                } else {
                    parts.push(innerText); // Render as plain text if not found or locked
                }
            } else if(segment) {
                // This is a plain text segment, apply the passive keyword highlighting
                parts.push(<React.Fragment key={index}>{renderTextWithPassiveHighlight(segment)}</React.Fragment>);
            }
        });

        return parts;
    };


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
        <div className="game-view log-panel" ref={containerRef}>
            {tooltip && (
                <div 
                    className="log-tooltip" 
                    style={{ 
                        top: `${tooltip.top}px`, 
                        left: `${tooltip.left}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="log-content">
                {transcript.map((entry, index) => (
                     <div key={index} className={`log-entry-container ${getContainerClass(entry.speaker)}`}>
                        <div className={`log-entry ${getEntryClass(entry.speaker)}`}>
                           {entry.speaker === 'user' && '> '}
                           {entry.speaker === 'model' 
                                ? parseAndRenderModelText(entry.text)
                                : entry.text
                           }
                        </div>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};