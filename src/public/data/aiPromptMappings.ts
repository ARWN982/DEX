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

export const promptMappings: PromptMapping[] = [
  {
    id: "message-count-by-log-level",
    prompt: "show me message count by log.level",
    query: `FROM logs-*
| STATS message_count = COUNT(*) BY log.level
| SORT message_count DESC`,
    description: "Count messages grouped by log level",
  },
  {
    id: "errors-count-by-field",
    prompt: "show me the number of errors by field",
    query: `FROM logs-*
| WHERE log.level == "error"
| STATS error_count = COUNT(*) BY {field}
| SORT error_count DESC`,
    description: "Find error logs by field",
  },
  {
    id: "errors-last-hour",
    prompt: "show me all errors from the last hour",
    query: `FROM logs-*
| WHERE @timestamp >= NOW() - 1h
| WHERE log.level == "error" OR message match "error"
| SORT @timestamp DESC
| LIMIT 100`,
    description: "Find error logs from the past hour",
  },
  {
    id: "top-error-messages",
    prompt: "what are the most common error messages",
    query: `FROM logs-*
| WHERE log.level == "ERROR" OR message CONTAINS "error"
| STATS count = COUNT() BY message
| SORT count DESC
| LIMIT 10`,
    description: "Aggregate and rank the most frequent error messages",
  },
  {
    id: "failed-requests",
    prompt: "find all failed HTTP requests",
    query: `FROM logs-*
| WHERE http.response.status_code >= 400
| STATS count = COUNT() BY http.response.status_code, url.path
| SORT count DESC`,
    description: "Group failed HTTP requests by status code and path",
  },
  {
    id: "slow-queries",
    prompt: "show slow database queries",
    query: `FROM logs-*
| WHERE message CONTAINS "query" AND duration > 1000
| SORT duration DESC
| KEEP @timestamp, message, duration, service.name
| LIMIT 50`,
    description: "Find database queries taking longer than 1 second",
  },
  {
    id: "user-activity",
    prompt: "show user login activity today",
    query: `FROM logs-*
| WHERE @timestamp >= NOW() - 24h
| WHERE event.action == "login" OR message CONTAINS "login"
| STATS logins = COUNT() BY user.name
| SORT logins DESC
| LIMIT 20`,
    description: "Aggregate user login events for the current day",
  },
  {
    id: "service-errors",
    prompt: "which services have the most errors",
    query: `FROM logs-*
| WHERE log.level == "ERROR"
| STATS error_count = COUNT() BY service.name
| SORT error_count DESC
| LIMIT 15`,
    description: "Count errors by service name",
  },
  {
    id: "memory-usage",
    prompt: "show high memory usage alerts",
    query: `FROM metrics-*
| WHERE system.memory.used.pct > 0.8
| SORT @timestamp DESC
| KEEP @timestamp, host.name, system.memory.used.pct
| LIMIT 100`,
    description: "Find hosts with memory usage above 80%",
  },
  {
    id: "recent-deployments",
    prompt: "show recent deployments",
    query: `FROM logs-*
| WHERE @timestamp >= NOW() - 7d
| WHERE event.action == "deploy" OR message CONTAINS "deployment"
| SORT @timestamp DESC
| KEEP @timestamp, service.name, service.version, user.name
| LIMIT 25`,
    description: "Recent deployment events in the last week",
  },
];

/**
 * Extract field name from user prompt (e.g., "by client.ip" -> "client.ip")
 */
const extractFieldFromPrompt = (userPrompt: string): string | null => {
  const normalizedPrompt = userPrompt.toLowerCase().trim();
  
  // Look for "by <field>" pattern
  const byMatch = normalizedPrompt.match(/\bby\s+([\w\.]+)/i);
  if (byMatch) {
    return byMatch[1];
  }
  
  return null;
};

/**
 * Substitute placeholders in query with actual values
 */
const substituteQueryPlaceholders = (query: string, userPrompt: string): string => {
  let result = query;
  
  // Extract field if query contains {field} placeholder
  if (result.includes('{field}')) {
    const field = extractFieldFromPrompt(userPrompt);
    if (field) {
      result = result.replace(/{field}/g, field);
    } else {
      // Default fallback field if none specified
      result = result.replace(/{field}/g, 'agent.name');
    }
  }
  
  return result;
};

/**
 * Find the best matching query for a given prompt
 * Uses simple string matching for prototype purposes
 */
export const findMatchingQuery = (userPrompt: string): PromptMapping | null => {
  const normalizedPrompt = userPrompt.toLowerCase().trim();

  // Prefer this over loose keyword match with "errors by field" (same words: show, me, by)
  const wantsMessageCountByLevel =
    normalizedPrompt.includes("message") &&
    normalizedPrompt.includes("count") &&
    normalizedPrompt.includes("by") &&
    /\blog[\s._]*level\b/.test(normalizedPrompt);

  if (wantsMessageCountByLevel) {
    const template = promptMappings.find((m) => m.id === "message-count-by-log-level");
    if (template) {
      return { ...template, prompt: userPrompt.trim() };
    }
  }

  // First, try exact matches
  const exactMatch = promptMappings.find(
    (mapping) => mapping.prompt.toLowerCase() === normalizedPrompt
  );

  if (exactMatch) {
    return {
      ...exactMatch,
      query: substituteQueryPlaceholders(exactMatch.query, userPrompt),
    };
  }

  // Then try partial matches based on keywords
  const keywordMatch = promptMappings.find((mapping) => {
    const promptKeywords = mapping.prompt.toLowerCase().split(" ");
    const userKeywords = normalizedPrompt.split(" ");

    // Check if at least 2 keywords match
    const matchingKeywords = userKeywords.filter((keyword) =>
      promptKeywords.some(
        (promptKeyword) =>
          promptKeyword.includes(keyword) || keyword.includes(promptKeyword)
      )
    );

    return matchingKeywords.length >= 2;
  });

  if (keywordMatch) {
    return {
      ...keywordMatch,
      query: substituteQueryPlaceholders(keywordMatch.query, userPrompt),
    };
  }

  return null;
};

/**
 * Get a fallback query when no specific match is found
 */
export const getFallbackQuery = (userPrompt: string): PromptMapping => {
  return {
    id: "fallback",
    prompt: userPrompt,
    query: `FROM logs-*
| WHERE message CONTAINS "${userPrompt.split(" ").slice(-1)[0]}"
| SORT @timestamp DESC
| LIMIT 100`,
    description: `Search for logs containing "${userPrompt}"`,
  };
};

/**
 * Simulate AI processing delay
 */
export const simulateAIProcessing = async (
  delayMs: number = 1500
): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
};
