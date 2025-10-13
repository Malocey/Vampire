# Dokumentation: Anwendungsarchitektur & Gemini KI-Integration

Dieses Dokument beschreibt die Kernarchitektur und die KI-Komponenten für das Projekt "Crimson Academy".

## 1. Kernarchitektur

Die Anwendung ist eine Single-Page-Application (SPA), die mit **React** und **TypeScript** entwickelt wurde. Sie nutzt moderne Web-Technologien, um ein immersives, sprachgesteuertes Rollenspielerlebnis zu schaffen.

### 1.1. State Management (`usePlayerStore.ts`)

Das gesamte Spielgeschehen und der Spielerfortschritt werden zentral über einen **Zustand**-Store verwaltet. Dieser Store ist das Herzstück der Anwendung und verantwortlich für:

-   **`playerData`**: Ein großes Objekt, das alle Informationen über den Spieler enthält (Statistiken, Inventar, Quests, freigeschaltete Codex-Einträge usw.).
-   **`gameState`**: Steuert, welche Ansicht angezeigt wird (`intro`, `creation`, `game`).
-   **Speichern & Laden:** Der Store integriert eine Auto-Save-Funktion. Jede Änderung am `playerData` wird sofort im `localStorage` des Browsers gespeichert. Dies gewährleistet, dass der Fortschritt des Spielers auch bei einem Neuladen der Seite erhalten bleibt.

## 2. Gemini KI-Integration

Die KI ist der Kern des Spielerlebnisses und wird für Dialoge, die Generierung von Spielinhalten und die Steuerung der Spielwelt eingesetzt.

### 2.1. Die System-Anweisung (`SYSTEM_INSTRUCTION`)

Die Konstante `SYSTEM_INSTRUCTION` in `src/config/api.ts` ist das Gehirn des Spielleiters (SL). Sie ist eine umfassende Anweisung, die der KI ihre Rolle, ihr geheimes Wissen über die Spielwelt, ihre erzählerischen Werkzeuge und ihre Verhaltensregeln vorgibt.

**Kernpunkte der Anweisung:**

-   **Rolle & Prämisse:** Definiert die KI als allwissenden Spielleiter in einer düsteren, futuristischen Vampir-Akademie.
-   **Der Rote Faden:** Enthält das zentrale Geheimnis der Geschichte (Kaelens wahre Identität), das die KI schrittweise enthüllen muss.
-   **Narrative Werkzeuge:** Leitet die KI an, wie sie durch "System-Glitches" oder "Speicherfragmente" Hinweise einstreuen kann.
-   **Emotionale Tiefe:** Fordert die KI auf, Emotionen, sensorische Details und innere Konflikte zu beschreiben ("Zeigen, nicht Sagen").
-   **Goldene Regeln:** Enthält unumstößliche Regeln wie "Konsistenz ist oberstes Gebbot", "Immer vorantreiben" und "Absolute Immersion".

#### 2.1.1. Stimmliche Meisterschaft: Die oberste Direktive

Dies ist der wichtigste und am stärksten überarbeitete Teil der Systemanweisung. Anstatt sich auf starre API-Konfigurationen zu verlassen, wird die KI nun angewiesen, als **Stimm-Schauspieler** zu agieren.

-   **Basisstimme vs. Charakter-Personas:** Die KI wird angewiesen, eine neutrale, vielseitige Basisstimme ('Zephyr') für den Erzähler zu verwenden. Wenn sie jedoch als Nicht-Spieler-Charakter (NSC) spricht, muss sie diese Basisstimme **komplett verlassen** und eine einzigartige, stimmliche Persona erschaffen.
-   **Schauspielerische Werkzeuge:** Die Anweisung gibt der KI konkrete Werkzeuge an die Hand, die sie nutzen MUSS, um Charaktere zu differenzieren: Tonhöhe (Pitch), Sprechtempo (Pacing), Lautstärke und Klangfarbe (Timbre).
-   **Verbindliche NPC-Profile:** Die Anweisung betont, dass die dynamisch hinzugefügten NSC-Stimmprofile (siehe Abschnitt 4) als unumstößliches Gesetz zu behandeln sind.
-   **Verbot von Monotonie:** Die Anweisung stellt klar, dass Monotonie als Scheitern ihrer Kernaufgabe betrachtet wird.

### 2.2. Die Voice Engine (`useGeminiLive.ts`)

Das Herzstück der Sprachinteraktion ist der `useGeminiLive`-Hook, der die **Gemini Live API** (`ai.live.connect`) kapselt.

**Funktionsweise:**

1.  **Dynamische Anweisung:** Vor dem Start einer Sitzung wird die `SYSTEM_INSTRUCTION` dynamisch erweitert. Es werden Abschnitte für **NPC-Stimmprofile** (basierend auf der Konfiguration) und **NPC-Gedächtnisprotokolle** (basierend auf früheren Interaktionen) hinzugefügt. Dies gibt der KI den vollständigen Kontext für die bevorstehende Szene.
2.  **Verbindung:** Der Hook stellt eine WebSocket-Verbindung zum Gemini-Backend her. Er verwendet eine flexible Basisstimme (`Zephyr`), um der KI maximale schauspielerische Freiheit gemäß der Systemanweisung zu ermöglichen. Audiodaten werden vom Mikrofon des Benutzers gestreamt.
3.  **Transkription & Audio-Output:** Die KI transkribiert die Spracheingabe des Benutzers und die eigene Audioausgabe in Echtzeit. Die Audioausgabe wird dekodiert und über die Web Audio API abgespielt, um eine nahtlose Konversation zu ermöglichen.
4.  **Turn-Management:** Der Hook verwaltet den Zustand der Konversation (`isListening`, `isPaused`) und löst nach Beendigung eines "Turns" (Benutzereingabe + KI-Antwort) weitere Aktionen aus.

### 2.3. Dynamische Inhaltsgenerierung

Neben der Sprachinteraktion wird Gemini auch zur Erstellung von Spielinhalten verwendet.

-   **Quest-Generierung (`SystemInterface.tsx`):** Auf der "Missionstafel" kann der Spieler neue Nebenquests generieren lassen. Hierfür wird eine `generateContent`-Anfrage mit einem detaillierten Prompt und einem strikten **JSON-Schema** an die KI gesendet. Die KI liefert eine vollständig formatierte Quest sowie potenziell neue Codex- und Karteneinträge zurück, die direkt in den Spielzustand integriert werden.
-   **Vorschlags-Generierung (`useGeminiLive.ts`):** Wenn der Spieler nicht spricht, analysiert die KI den letzten Gesprächskontext und generiert kontextbezogene Vorschläge für Aktionen, Dialoge oder Untersuchungen. Auch hier wird ein JSON-Schema verwendet, um eine strukturierte Antwort zu gewährleisten.

### 2.4. Skript-Generierung (Testfunktion)

Um die Fähigkeit der KI zu demonstrieren, nicht nur als interaktiver Spielleiter, sondern auch als kreativer Drehbuchautor zu fungieren, wurde eine Testfunktion implementiert.

-   **Auslöser:** Ein neuer Button im Header der Anwendung startet die Generierung.
-   **Prozess:**
    1.  Ein `generateContentStream`-Aufruf wird mit einem spezialisierten Prompt an die Gemini-KI gesendet.
    2.  Der Prompt definiert eine Szene und mehrere Charaktere mit unterschiedlichen Persönlichkeiten und **detaillierten Stimmbeschreibungen** (z.B. ein alter Vampir mit Akzent, ein neugieriges Kind, eine monotone Roboter-Drohne).
    3.  Die KI erhält die Anweisung, einen kurzen, in-character Dialog zu schreiben, der zur Szene passt.
    4.  Das Ergebnis ist ein formatiertes Skript, das in Echtzeit in das Log-Panel der Anwendung gestreamt wird.

Diese Funktion dient als Machbarkeitsstudie, um zu zeigen, wie die KI für die Erstellung von vordefinierten, aber dynamisch klingenden narrativen Inhalten genutzt werden kann, die über die reine Reaktion auf Spielereingaben hinausgehen.

## 3. Spielmechaniken & UI

### 3.1. Interaktive Lore (`LogPanel.tsx`)

Um die Welt interaktiv zu gestalten, wird eine spezielle Syntax in den KI-Antworten verwendet: `[h:codex_id]Hervorzuhebender Text[/h]`.

-   Der `LogPanel` parst diesen Text und wandelt ihn in einen interaktiven `<span>` um.
-   Wenn der Benutzer mit der Maus über diesen Text fährt, wird ein Tooltip mit der Beschreibung aus dem entsprechenden Codex-Eintrag angezeigt.
-   Dies verbindet die Erzählung direkt mit der Datenbank des Spiels.

### 3.2. Automatische Spielwelt-Updates (`useGeminiLive.ts`)

Die Funktion `processModelResponse` analysiert den Text jeder KI-Antwort auf Schlüsselwörter.

-   **Codex-Freischaltung:** Wenn ein Schlüsselwort für einen noch gesperrten Codex-Eintrag erwähnt wird, wird dieser Eintrag freigeschaltet.
-   **Quest-Fortschritt:** Wenn ein Schlüsselwort, das mit einem Quest-Ziel verknüpft ist (z. B. das Erreichen eines Ortes), erkannt wird, das entsprechende Ziel als erledigt markiert.
-   Dies ermöglicht es der KI, den Spielzustand durch ihre Erzählung organisch zu verändern.

## 4. Konfiguration des Stimmensystems

Das Spiel verwendet ein flexibles System, um jedem NSC eine einzigartige und wiedererkennbare Stimme zu geben. Anstatt für jeden Charakter eine starre, vorgefertigte Stimme auszuwählen, nutzt das System die schauspielerischen Fähigkeiten der KI.

**Funktionsweise:**

1.  **Stimmzuweisung:** In `src/config/codexData.ts` wird jedem NSC eine `voice`-Eigenschaft zugewiesen, die einem der `PrebuiltVoice`-Typen entspricht (z.B. 'Orus', 'Kore').
2.  **Charakteristiken-Map:** Die `VOICE_CHARACTERISTICS`-Map in `src/config/gameConfig.ts` verknüpft jeden Stimm-Namen mit einer beschreibenden Eigenschaft (z. B. 'Orus' -> 'Unternehmen').
3.  **Dynamische Anweisungserweiterung:** Wie in Abschnitt 2.2 beschrieben, werden diese Informationen verwendet, um die `SYSTEM_INSTRUCTION` vor jeder Sitzung dynamisch zu erweitern. Die KI erhält eine klare Anweisung wie: `"Für den Charakter X, nutze eine Stimme, die 'Charakteristik Y' ist."`
4.  **Schauspielerische Interpretation:** Die KI nutzt diese Anweisung, um ihre Basisstimme (`Zephyr`) zu modulieren und eine einzigartige, zur Beschreibung passende Persona zu erschaffen.

### 4.1. Verfügbare Stimmcharakteristiken (`PrebuiltVoice`)

Die folgende Tabelle listet alle derzeit im System konfigurierten Stimmcharakteristiken auf, die die KI zur Gestaltung ihrer Rollen verwenden kann.

| Stimmen-Name  | Charakteristik                  |
| :------------ | :------------------------------ |
| `Zephyr`      | Hell                            |
| `Puck`        | Upbeat                          |
| `Charon`      | Informativ                      |
| `Kore`        | Klar, präzise und leicht kühl   |
| `Fenrir`      | Leicht nervös, aber bestimmt    |
| `Leda`        | Jugendlich                      |
| `Orus`        | Unternehmen                     |
| `Aoede`       | Breezy                          |
| `Callirrhoe`  | Gelassen                        |
| `Autonoe`     | Hell                            |
| `Enceladus`   | Breathy                         |
| `Iapetus`     | Clear                           |
| `Umbriel`     | Gelassen                        |
| `Algieba`     | Smooth                          |
| `Despina`     | Weich                           |
| `Erinome`     | Wolkenlos                       |
| `Algenib`     | Kiesig                          |
| `Rasalgethi`  | Informativ                      |
| `Laomedeia`   | Upbeat                          |
| `Achernar`    | Weich                           |
| `Alnilam`     | Firm                            |
| `Schedar`     | Gerade                          |
| `Gacrux`      | Nicht jugendfrei                |
| `Pulcherrima` | Kess                            |
| `Achird`      | Freundlich                      |
| `Zubenelgenubi`| Casual                         |
| `Vindemiatrix`| Sanft                           |
| `Sadachbia`   | Lively                          |
| `Sadaltager`  | Sachkundig                      |
| `Sulafat`     | Warm                            |

## 5. KI-gestützte Chronik-Funktion (`ChronikPanel.tsx`)

Als innovative Meta-Ebene wurde das "Chronik"-Panel eingeführt. Es ermöglicht dem Spieler, die im Spiel erlebten Ereignisse in eine narrative Form zu bringen und interaktiv zu erforschen.

### 5.1. Generierung der Chronik

-   **Auslöser:** Der Spieler kann manuell die Generierung eines Chronik-Eintrags anstoßen.
-   **Prozess:**
    1.  Das gesamte Dialogprotokoll (`transcript`) aus dem `playerData` wird extrahiert.
    2.  Ein spezialisierter Prompt weist die Gemini-KI an, die Rolle eines "meisterhaften Chronisten" einzunehmen.
    3.  Die KI erhält die Anweisung, das rohe Protokoll in eine dramatische, introspektive Erzählung im Präteritum aus der Perspektive des Protagonisten Kaelen umzuwandeln.
    4.  Das Ergebnis ist ein zusammenhängender, literarischer Text, der die Ereignisse zusammenfasst und emotional anreichert.

### 5.2. Interaktive Verfeinerung

Nachdem die Chronik generiert wurde, kann der Spieler eine "Was-wäre-wenn"-Analyse durchführen.

-   **Funktion:** Der Spieler kann eine textbasierte Frage zur generierten Geschichte stellen (z. B. "Was wäre passiert, wenn ich anders gehandelt hätte?").
-   **Prozess:**
    1.  Ein zweiter, spezialisierter Prompt wird an die Gemini-KI gesendet.
    2.  Dieser Prompt enthält die bereits generierte Chronik und die spezifische Frage des Spielers.
    3.  Die KI agiert nun als "kreativer Co-Autor" und beantwortet die Frage, indem sie plausible alternative Szenarien, Charakter-Motivationen oder zusätzliche Details im Kontext der Geschichte liefert.

Dieses Feature verwandelt das passive Dialogprotokoll in ein aktives Werkzeug zur Gestaltung und Reflexion der persönlichen Spielergeschichte.