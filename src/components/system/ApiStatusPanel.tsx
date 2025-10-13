import React from 'react';
import { useApiStatusStore } from '../../store/useApiStatusStore';
import { API_MODULES } from '../../types';

const StatusIndicator = ({ status }: { status: string }) => {
    const statusClasses: { [key: string]: string } = {
        operational: 'status-operational',
        degraded: 'status-degraded',
        unavailable: 'status-unavailable',
    };
    return <span className={`status-indicator ${statusClasses[status] || ''}`}></span>;
};

export const ApiStatusPanel = () => {
    const { status, resetAllStatus } = useApiStatusStore();

    return (
        <div className="api-status-panel">
            <div className="api-status-header">
                <h3>KI-Modulstatus</h3>
                <button onClick={resetAllStatus} className="reset-status-btn">Status-Reset</button>
            </div>
            <p className="api-status-description">
                Überwacht den Zustand der verschiedenen KI-Dienste. Wenn ein Modul als 'UNAVAILABLE' markiert ist, sind die API-Limits für diesen Dienst wahrscheinlich vorübergehend erreicht.
            </p>
            <ul className="api-status-list">
                {Object.entries(API_MODULES).map(([key, name]) => {
                    const moduleKey = key as keyof typeof status;
                    const moduleStatus = status[moduleKey];
                    return (
                        <li key={key} className="api-module-item">
                            <div className="api-module-name">
                                <StatusIndicator status={moduleStatus} />
                                {name}
                            </div>
                            <div className="api-module-status-container">
                                <div className={`api-module-status status-text-${moduleStatus}`}>
                                    {moduleStatus.toUpperCase()}
                                </div>
                                {moduleStatus === 'unavailable' && (
                                    <div className="api-status-tooltip-icon" title="API-Limit erreicht. Bitte später erneut versuchen oder den Status zurücksetzen.">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};