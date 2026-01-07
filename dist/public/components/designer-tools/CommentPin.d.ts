import React from 'react';
import { CommentThread } from '../../types/comments';
interface CommentPinProps {
    thread: CommentThread;
    isActive: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}
export declare const CommentPin: React.FC<CommentPinProps>;
export {};
//# sourceMappingURL=CommentPin.d.ts.map