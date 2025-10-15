## Agent Instructions for Crimson Academy

Welcome, agent. This document provides instructions for working on the "Crimson Academy: The Awakened Blood" project.

### Project Overview

This is a voice-driven, immersive RPG built with React, Vite, and the Gemini LIVE API. The player takes on the role of Kaelen, an amnesiac vampire cadet at a futuristic military academy. The AI game master is responsible for creating a dynamic and reactive world, playing all NPCs, and guiding the player through the story.

### Key Technologies

-   **React:** The core of the frontend application.
-   **Vite:** The build tool for the frontend.
--   **Zustand:** For state management.
-   **Gemini LIVE API:** For real-time voice interaction and AI-driven storytelling.
-   **Howler.js:** For sound effects and music.

### Development Workflow

1.  **Start the development server:** Run `npm run dev` to start the Vite development server.
2.  **Make changes:** Modify the source code in the `src` directory.
3.  **Test your changes:** Run `npm test` to run the test suite.
4.  **Submit your changes:** Follow the standard commit and pull request process.

### Important Files

-   `src/App.tsx`: The main application component.
-   `src/hooks/useGeminiLive.ts`: The core logic for interacting with the Gemini LIVE API.
-   `src/config/api.ts`: Contains the system prompt for the AI model.
-   `src/utils/speechParser.ts`: Parses the AI's output to trigger voice changes and sound effects.
-   `index.css`: The main stylesheet for the application.

### Coding Conventions

-   Follow standard React and TypeScript best practices.
-   Use descriptive names for variables, functions, and components.
-   Keep components small and focused on a single responsibility.
-   Write unit tests for all new features and bug fixes.
-   Document your code with comments where necessary.

### AI Model Instructions

The AI model's behavior is primarily controlled by the system prompt in `src/config/api.ts`. When modifying this prompt, be sure to follow these guidelines:

-   Be clear and concise in your instructions.
-   Use specific keywords and syntax to trigger voice changes and sound effects.
-   Provide examples to illustrate the desired output format.
-   Test your changes thoroughly to ensure the AI behaves as expected.

By following these instructions, you can help ensure that the project remains well-maintained and that future development is as smooth as possible.