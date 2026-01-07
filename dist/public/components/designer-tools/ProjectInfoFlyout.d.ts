import React from 'react';
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
interface ProjectInfoFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
    projectMetadata: ProjectMetadata | null;
    onSave: (metadata: ProjectMetadata) => void;
}
export declare const ProjectInfoFlyout: React.FC<ProjectInfoFlyoutProps>;
export {};
//# sourceMappingURL=ProjectInfoFlyout.d.ts.map