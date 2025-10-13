/**
 * Checks if an error object indicates a resource exhausted (429) error from the API.
 * The error message from the API is often a stringified JSON object.
 * @param error The unknown error caught in a try-catch block.
 * @returns True if the error is a quota error, false otherwise.
 */
export function isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
        try {
            // The actual error details are often in a JSON string within the message property
            const errorDetails = JSON.parse(error.message);
            if (errorDetails?.error?.status === 'RESOURCE_EXHAUSTED' || errorDetails?.error?.code === 429) {
                return true;
            }
        } catch (e) {
            // If parsing fails, check the raw string for common indicators
            if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
                return true;
            }
        }
    }
    return false;
}
