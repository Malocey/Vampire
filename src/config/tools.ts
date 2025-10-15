import { FunctionDeclaration, Type } from "@google/genai";

export const GENERATE_QUEST_TOOL: FunctionDeclaration = {
    name: "generate_quest",
    description: "Generates a new side quest for the player based on their current progress and the type of quest requested.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            quest_type: {
                type: Type.STRING,
                description: "The type of quest to generate (e.g., 'Sammelmission', 'Eliminierungsmission', 'Untersuchungsmission')."
            }
        },
        required: ["quest_type"]
    }
};