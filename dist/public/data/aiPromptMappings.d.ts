/**
 * AI Prompt to ES|QL Query Mappings
 *
 * This file contains mappings from user prompts to generated ES|QL queries
 * for prototype simulation purposes.
 */
export interface PromptMapping {
    id: string;
    prompt: string;
    query: string;
    description?: string;
}
export declare const promptMappings: PromptMapping[];
/**
 * Find the best matching query for a given prompt
 * Uses simple string matching for prototype purposes
 */
export declare const findMatchingQuery: (userPrompt: string) => PromptMapping | null;
/**
 * Get a fallback query when no specific match is found
 */
export declare const getFallbackQuery: (userPrompt: string) => PromptMapping;
/**
 * Simulate AI processing delay
 */
export declare const simulateAIProcessing: (delayMs?: number) => Promise<void>;
//# sourceMappingURL=aiPromptMappings.d.ts.map