import React from 'react';
interface DesignerToolbarProps {
    isCommentingEnabled: boolean;
    onToggleCommenting: () => void;
    isJobStoriesTrackingEnabled: boolean;
    onToggleJobStoriesTracking: () => void;
    onCreateVersion?: () => void;
    projectName?: string;
}
export declare const DesignerToolbar: React.FC<DesignerToolbarProps>;
export {};
//# sourceMappingURL=DesignerToolbar.d.ts.map