import { useState, useCallback } from 'react';

interface UseESQLQueryResult {
  executeQuery: (query: string, timeRange?: { from?: string; to?: string }) => Promise<void>;
  data: any[];
  columns: Array<{ name: string; type: string }>;
  isLoading: boolean;
  error: string | null;
}

export const useESQLQuery = (): UseESQLQueryResult => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (query: string, timeRange?: { from?: string; to?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/esql/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          from: timeRange?.from,
          to: timeRange?.to
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Handle direct Elasticsearch response format
      setData(result.values || []);
      setColumns(result.columns || []);
    } catch (err: any) {
      setError(err.message || 'Failed to execute query');
      setData([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeQuery,
    data,
    columns,
    isLoading,
    error,
  };
};