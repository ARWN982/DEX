"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useESQLQuery = void 0;
const react_1 = require("react");
const useESQLQuery = () => {
    const [data, setData] = (0, react_1.useState)([]);
    const [columns, setColumns] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const executeQuery = (0, react_1.useCallback)(async (query, timeRange) => {
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
        }
        catch (err) {
            setError(err.message || 'Failed to execute query');
            setData([]);
            setColumns([]);
        }
        finally {
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
exports.useESQLQuery = useESQLQuery;
//# sourceMappingURL=useESQLQuery.js.map