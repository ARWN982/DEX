"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjectMetadata = void 0;
const react_1 = require("react");
const useProjectMetadata = (projectName) => {
    const [metadata, setMetadata] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!projectName) {
            setMetadata(null);
            setLoading(false);
            setError(null);
            return;
        }
        const fetchMetadata = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/project-metadata/${projectName}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
                }
                const data = await response.json();
                setMetadata(data);
            }
            catch (err) {
                console.error('Error fetching project metadata:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
                // Set fallback metadata
                setMetadata({
                    projectName,
                    designer: '',
                    pm: '',
                    briefDescription: '',
                    prdLink: '',
                    githubIssueLink: '',
                    breadcrumb: projectName,
                });
            }
            finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [projectName]);
    return { metadata, loading, error };
};
exports.useProjectMetadata = useProjectMetadata;
//# sourceMappingURL=useProjectMetadata.js.map