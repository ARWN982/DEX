import React from "react";
import { CommentThread as CommentThreadType, CommentFormData } from "../../types/comments";
interface CommentThreadProps {
    thread: CommentThreadType;
    onAddComment: (data: CommentFormData) => void;
    onResolveThread: () => void;
    onClose: () => void;
    style?: React.CSSProperties;
}
export declare const CommentThread: React.FC<CommentThreadProps>;
export {};
//# sourceMappingURL=CommentThread.d.ts.map