import React from "react";
export interface ProjectMetadata {
    projectName: string;
    designer: string;
    pm: string;
    briefDescription: string;
    prdLink: string;
    githubIssueLink: string;
    breadcrumb: string;
}
interface AboutFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    projectMetadata: ProjectMetadata | null;
}
export declare const AboutFlyout: React.FC<AboutFlyoutProps>;
export {};
//# sourceMappingURL=AboutFlyout.d.ts.map