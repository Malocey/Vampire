import React, { useRef, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { PlayerData } from '../../types';
import { ai } from '../../config/api';
import { exportSaveToFile, importSaveFromFile } from '../../utils/saveLoad';

interface HeaderProps {
    isMuted: boolean;
    onToggleMute: () => void;
    onToggleSystem: () => void;
}

export const Header = ({ isMuted, onToggleMute, onToggleSystem }: HeaderProps) => {
    const { playerData, setPlayerData, updateTranscript } = usePlayerStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTestLoading, setIsTestLoading] = useState(false);

    const handleExport = () => {
        exportSaveToFile();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const importedData = await importSaveFromFile(file);
            if (window.confirm('Möchten Sie den aktuellen Spielstand wirklich mit den Daten aus der Datei überschreiben?')) {
                setPlayerData(importedData);
                saveGame(importedData);
                alert('Spielstand erfolgreich importiert!');
            }
        } catch (error) {
            console.error('Fehler beim Importieren des Spielstands:', error);
            alert(`Fehler beim Importieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleTestConversation = async () => {
        setIsTestLoading(true);
        updateTranscript(prev => [...prev, { speaker: 'system', text: 'Generiere Test-Dialog...' }]);

        const prompt = `
            Erstelle einen kurzen Dialog zwischen den folgenden drei Charakteren. Die Szene spielt in einem schwach beleuchteten Wartungsgang der Crimson Academy. Sie haben gerade ein seltsames, metallisches Kratzen aus der Dunkelheit gehört.

            **Charaktere:**
            1.  **Viktor:** Ein alter Vampir mit einem subtilen, osteuropäischen Akzent. Seine Stimme ist tief und 'kiesig'. Er ist pragmatisch und vorsichtig. (Stimme: 'Algenib')
            2.  **Lily:** Ein junges, neugieriges Mädchen. Ihre Stimme ist hell, jugendlich und oft voller Aufregung. Sie ist furchtlos. (Stimme: 'Leda')
            3.  **Unit 734:** Eine kleine Wartungsdrohne. Spricht absolut monoton, mechanisch, mit unnatürlichen Pausen zwischen den Wörtern. Ihre Stimme ist klinisch und neutral. (Stimme: 'Kore')

            **Anweisungen:**
            - Der Dialog sollte kurz sein, nur ein paar Zeilen für jeden Charakter.
            - Jeder Charakter soll entsprechend seiner Persönlichkeit reagieren.
            - Formatiere den Output klar, indem du den Namen des Charakters vor jede Zeile setzt. Beispiel: \`Viktor: "Was war das?"\`
        `;

        let fullResponse = "";
        try {
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            updateTranscript(prev => [...prev, { speaker: 'model', text: "" }]);

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    updateTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.speaker === 'model') {
                            last.text = fullResponse;
                            return [...prev.slice(0, -1), last];
                        }
                        return prev;
                    });
                }
            }

        } catch (error) {
            console.error('Fehler beim Generieren des Test-Dialogs:', error);
            updateTranscript(prev => [...prev, { speaker: 'system', text: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }]);
        } finally {
            setIsTestLoading(false);
        }
    };


    return (
        <header>
            <span>Crimson Academy</span>
            <div className="header-controls">
                 <button onClick={handleTestConversation} className="save-btn" title="Test-Dialog generieren" aria-label="Test-Dialog generieren" disabled={isTestLoading}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </button>
                 <button onClick={handleImportClick} className="save-btn" title="Spielstand importieren" aria-label="Spielstand importieren">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    style={{ display: 'none' }}
                />
                <button onClick={handleExport} className="save-btn" title="Spielstand exportieren" aria-label="Spielstand exportieren">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
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
                 <button onClick={onToggleSystem} className="system-toggle-btn" aria-label="System-Interface umschalten">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>
            </div>
        </header>
    )
};