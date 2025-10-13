import React, { useState, useMemo } from 'react';
import { MapLocation } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';

export const KartePanel = () => {
    const { playerData } = usePlayerStore();
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; top: number; left: number } | null>(null);

    const questLocationIds = useMemo(() => {
        if (!playerData) return [];
        return playerData.quests
            .filter(q => q.status === 'active' && q.locationId)
            .map(q => q.locationId);
    }, [playerData]);

    const handleMouseEnter = (location: MapLocation, event: React.MouseEvent) => {
        const { clientX, clientY } = event;
        const panelRect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
        const content = (
            <>
                <h4>{location.name}</h4>
                <p>{location.description}</p>
            </>
        );
        setTooltip({
            content,
            left: clientX - panelRect.left + 15,
            top: clientY - panelRect.top,
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    if (!playerData) return null;

    return (
        <div className="karte-panel">
            <div className="map-container">
                <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    {playerData.mapData.map(location => {
                        const isDiscovered = location.discovered;
                        if (!isDiscovered) return null;

                        const isQuestTarget = questLocationIds.includes(location.id);

                        return (
                            <g 
                                key={location.id} 
                                className={`map-location ${isDiscovered ? 'discovered' : ''}`}
                                transform={`translate(${location.coordinates.x}, ${location.coordinates.y})`}
                                onMouseEnter={(e) => handleMouseEnter(location, e)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <circle className="map-location-dot" r="2" />
                                <text className="map-location-text" y="-4">{location.name}</text>
                                {isQuestTarget && <circle className="quest-marker" r="5" />}
                            </g>
                        );
                    })}
                </svg>
            </div>
            {tooltip && (
                <div className="map-tooltip" style={{ top: tooltip.top, left: tooltip.left }}>
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};