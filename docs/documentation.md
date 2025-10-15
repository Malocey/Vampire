# Crimson Academy: The Awakened Blood - Documentation

## 1. Introduction

Welcome to the official documentation for "Crimson Academy: The Awakened Blood," an immersive, voice-driven RPG powered by the Gemini LIVE API. This document provides a comprehensive overview of the project, its features, architecture, and setup instructions.

### 1.1. Project Vision

The goal of this project is to create a deeply engaging and reactive storytelling experience. The player embodies Kaelen, an amnesiac vampire cadet, and interacts with the world entirely through their voice. The AI game master adapts the narrative in real-time, creating a unique and personal journey for every player.

### 1.2. Core Features

-   **Real-Time Voice Interaction:** Communicate directly with the game world and its characters using your voice.
-   **Dynamic Storytelling:** The AI game master generates a continuous and adaptive story based on your actions and decisions.
-   **Multi-Voice Characters:** NPCs have distinct voices and emotional tones, creating a more immersive and believable experience.
-   **Dynamic Gameplay Elements:** The AI generates quests, inventory items, and codex entries on the fly.
-   **Modern, Immersive UI:** The user interface is designed to be both visually appealing and highly functional, with a focus on immersion.

## 2. Technical Architecture

The project is built on a modern web stack, utilizing the following technologies:

-   **Frontend:** React with Vite
-   **State Management:** Zustand
-   **AI & Voice:** Google Gemini LIVE API
-   **Audio:** Howler.js

### 2.1. Project Structure

The project is organized into the following directories:

-   `public/`: Contains the `audio-processor.js` for the audio worklet.
-   `src/`: The main source code for the application.
    -   `components/`: React components for the UI.
    -   `config/`: Configuration files for the API, voices, and sounds.
    -   `hooks/`: Custom React hooks for managing state and side effects.
    -   `store/`: Zustand stores for global state management.
    -   `types/`: TypeScript type definitions.
    -   `utils/`: Utility functions.
-   `docs/`: Project documentation.

## 3. Getting Started

Follow these steps to get the project up and running on your local machine.

### 3.1. Prerequisites

-   Node.js and npm
-   A valid Gemini API key

### 3.2. Installation

1.  Clone the repository:
    `git clone <repository-url>`
2.  Install the dependencies:
    `npm install`
3.  Create a `.env.local` file in the root of the project and add your Gemini API key:
    `API_KEY=<your-api-key>`
4.  Start the development server:
    `npm run dev`

## 4. Key Modules and Systems

This section provides a more detailed look at the most important parts of the codebase.

### 4.1. Voice System (`useGeminiLive.ts`)

The `useGeminiLive.ts` hook is the heart of the voice interaction system. It manages the connection to the Gemini LIVE API, handles audio input and output, and processes the AI's responses.

### 4.2. AI Prompting (`api.ts`)

The `SYSTEM_INSTRUCTION` in `src/config/api.ts` is the primary tool for shaping the AI's behavior. It provides detailed instructions on the game's lore, the AI's role as a game master, and the specific syntax for triggering voice changes and sound effects.

### 4.3. Speech Parsing (`speechParser.ts`)

The `parseSpeechCommands` function in `src/utils/speechParser.ts` is responsible for parsing the AI's text output. It uses regular expressions to identify and extract commands for changing voices, playing sound effects, and controlling music.

### 4.4. User Interface (`index.css` & `components/`)

The UI is built with React and styled with CSS. The main stylesheet, `index.css`, defines the overall look and feel of the application, while the components in `src/components/` are responsible for rendering the different parts of the UI.

## 5. Future Development

This project has a lot of potential for future expansion. Some possible areas for improvement include:

-   **Advanced AI:** Implement more sophisticated AI behaviors, such as long-term memory and more complex NPC relationships.
-   **Expanded Content:** Add more quests, characters, and locations to the game world.
-   **Improved UI/UX:** Continue to refine the user interface to make it even more immersive and user-friendly.

By leveraging the power of the Gemini LIVE API, the possibilities are virtually endless.