import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useApiStatusStore } from '../../store/useApiStatusStore';
import { ai } from '../../config/api';
import { isQuotaError } from '../../utils/errorUtils';
import { API_MODULES } from '../../types';

export const ChronikPanel = () => {
    const { playerData } = usePlayerStore();
    const { setModuleStatus } = useApiStatusStore();
    const [isLoading, setIsLoading] = useState(false);
    const [generatedStory, setGeneratedStory] = useState<string | null>(null);

    const [isInteracting, setIsInteracting] = useState(false);
    const [interactiveQuestion, setInteractiveQuestion] = useState('');
    const [interactiveResponse, setInteractiveResponse] = useState<string | null>(null);

    const handleGenerateStory = async () => {
        if (!playerData || !playerData.transcript || playerData.transcript.length === 0) {
            alert("Nicht genügend Daten im Dialogprotokoll, um eine Geschichte zu generieren.");
            return;
        }
        setIsLoading(true);
        setGeneratedStory(null);
        setInteractiveResponse(null);

        const dialogHistory = playerData.transcript
            .map(entry => {
                if (entry.speaker === 'user') return `Kaelen: "${entry.text}"`;
                if (entry.speaker === 'model') return `Erzähler/NSC: "${entry.text}"`;
                return `System: ${entry.text}`;
            })
            .join('\n');

        const prompt = `
            Du bist ein meisterhafter Chronist und Geschichtenerzähler. Deine Aufgabe ist es, das folgende rohe Dialogprotokoll aus einem Rollenspiel in einen fesselnden, narrativen Tagebucheintrag oder ein Kapitel einer Chronik aus der Perspektive des Protagonisten Kaelen zu verwandeln.

            **Anweisungen:**
            1.  **Stil:** Schreibe im Präteritum (Vergangenheitsform). Der Ton sollte dramatisch, introspektiv und atmosphärisch sein.
            2.  **Perspektive:** Konzentriere dich auf Kaelens Gedanken, Gefühle und Wahrnehmungen. Wandle seine gesprochenen Worte in erzählte Handlungen und Absichten um.
            3.  **Zusammenfassung:** Fasse die Ereignisse zusammen, anstatt jeden einzelnen Dialogsatz wörtlich zu wiederholen. Extrahiere die wichtigsten Aktionen, Entscheidungen und Enthüllungen.
            4.  **Hintergrund:** Berücksichtige, dass Kaelen unter Amnesie leidet und versucht, seine Identität und die Geheimnisse der "Crimson Academy" zu lüften.
            5.  **Format:** Gib nur den reinen Text der Geschichte zurück. Keine Einleitungen, keine Erklärungen, nur die Chronik.

            **Dialogprotokoll:**
            ---
            ${dialogHistory}
            ---
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setGeneratedStory(response.text);
        } catch (error) {
             if (isQuotaError(error)) {
                setModuleStatus('chronicle', 'unavailable');
                setGeneratedStory(`Fehler bei der Generierung. Das ${API_MODULES.chronicle} ist derzeit nicht erreichbar. Bitte den Systemstatus prüfen.`);
            } else {
                console.error("Fehler beim Generieren der Chronik:", error);
                setGeneratedStory("Ein unerwarteter Fehler ist beim Schreiben der Chronik aufgetreten.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInteractiveQuery = async () => {
        if (!interactiveQuestion.trim() || !generatedStory) return;

        setIsInteracting(true);
        setInteractiveResponse(null);

        const prompt = `
            Du bist ein kreativer Co-Autor und "Was-wäre-wenn"-Analyst für ein Rollenspiel. Gegeben ist eine von einer KI generierte Zusammenfassung der Ereignisse (die Chronik) und eine Frage des Spielers dazu. Deine Aufgabe ist es, die Frage fantasievoll und im Kontext der Chronik zu beantworten.

            **Anweisungen:**
            1.  **Kontext treu bleiben:** Deine Antwort muss auf den Ereignissen und dem Ton der Chronik aufbauen.
            2.  **Kreative Interpretation:** Du kannst Details hinzufügen, Motivationen von Charakteren ergründen oder plausible alternative Szenarien basierend auf der Frage des Spielers erkunden.
            3.  **In-Character bleiben:** Antworte als allwissender Erzähler, nicht als KI. Brich nicht die vierte Wand.

            **Die Chronik:**
            ---
            ${generatedStory}
            ---

            **Frage des Spielers:**
            ---
            ${interactiveQuestion}
            ---

            **Deine Antwort:**
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setInteractiveResponse(response.text);
        } catch (error) {
            if (isQuotaError(error)) {
                setModuleStatus('chronicle', 'unavailable');
                setInteractiveResponse(`Analyse fehlgeschlagen. Das ${API_MODULES.chronicle} ist derzeit nicht erreichbar. Bitte den Systemstatus prüfen.`);
            } else {
                 console.error("Fehler bei der interaktiven Anfrage:", error);
                setInteractiveResponse("Die Fäden des Schicksals sind an dieser Stelle verworren. Eine klare Antwort ist nicht möglich.");
            }
        } finally {
            setIsInteracting(false);
        }
    };


    return (
        <div className="chronik-panel">
            <div className="chronik-actions">
                <button onClick={handleGenerateStory} disabled={isLoading}>
                    {isLoading ? 'Schreibe Chronik...' : 'Chronik-Eintrag generieren'}
                </button>
            </div>
            <div className="chronik-content">
                {generatedStory}
            </div>

            {generatedStory && (
                <div className="chronik-interactive">
                    <h3>Interaktive Chronik</h3>
                    <p>Stelle eine Frage zu den Ereignissen, um Details zu erfahren oder alternative Wege zu erkunden.</p>
                    <textarea
                        value={interactiveQuestion}
                        onChange={(e) => setInteractiveQuestion(e.target.value)}
                        placeholder="z.B. Was wäre passiert, wenn ich Graves widersprochen hätte?"
                        disabled={isInteracting}
                    />
                    <button onClick={handleInteractiveQuery} disabled={isInteracting || !interactiveQuestion.trim()}>
                        {isInteracting ? 'Analysiere...' : 'Frage stellen'}
                    </button>
                    {interactiveResponse && (
                        <div className="interactive-response">
                            {interactiveResponse}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};