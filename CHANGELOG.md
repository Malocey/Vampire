# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased] - 2025-10-16

### Hinzugefügt

-   **Python-Backend-Architektur:** Umstellung von einer reinen Frontend-Anwendung auf eine Client-Server-Architektur mit einem Python-Backend (FastAPI) zur Handhabung der Gemini-API-Logik, der Spielzustandsverwaltung und der Multi-Voice-Funktionalität.
-   **Projektdokumentation:** `docs/conversation_history.md` und `docs/game_ideas.md` erstellt, um den Entwicklungsverlauf und zukünftige Ideen zu verfolgen.
-   **Agenten-Anweisungen:** `AGENTS.md` aktualisiert mit Regeln zum Führen des Changelogs und zum Vorschlagen von Spielideen.
-   **Changelog:** Diese `CHANGELOG.md`-Datei wurde dem Projekt hinzugefügt.

### Geändert

-   **Hosting-Strategie:** Die ursprüngliche Deployment-Strategie für Vercel wurde aufgegeben, da Vercel Serverless Functions keine persistenten WebSocket-Verbindungen unterstützen. Die neue Strategie zielt auf ein Deployment bei einem Anbieter wie Render ab.
-   **Frontend-Hook `useGeminiLive.ts`:** Der Hook wurde komplett umgeschrieben, um mit dem neuen Python-Backend über WebSockets zu kommunizieren, anstatt direkt mit der Google Gemini API. Er verwendet nun die Browser-TTS-Engine für die Sprachausgabe.
-   **HTML-Struktur `index.html`:** Die fehlerhafte und widersprüchliche `<script type="importmap">` wurde entfernt und der Skript-Pfad für Vite korrigiert, um das grundlegende Render-Problem der Anwendung zu beheben.

### Fehlerbehebung

-   Ein schwerwiegender Fehler wurde behoben, bei dem die Anwendung aufgrund einer fehlerhaften `index.html`-Konfiguration einen leeren Bildschirm anzeigte, ohne Fehler in der Konsole zu protokollieren.