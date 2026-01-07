export interface ProjectMetadata {
    projectName: string;
    designer: string;
    pm: string;
    briefDescription: string;
    prdLink: string;
    githubIssueLink: string;
    breadcrumb: string;
    thumbnail?: {
        filename: string;
        version: string;
        createdAt: string;
        url: string;
    };
}
export declare const useProjectMetadata: (projectName: string | null) => {
    metadata: ProjectMetadata | null;
    loading: boolean;
    error: string | null;
};
//# sourceMappingURL=useProjectMetadata.d.ts.map