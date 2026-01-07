import React from "react";
import { CommentPosition } from "../../types/comments";
interface CommentCreatorProps {
    position: CommentPosition;
    onCreateComment: (content: string) => void;
    onCancel: () => void;
    style?: React.CSSProperties;
}
export declare const CommentCreator: React.FC<CommentCreatorProps>;
export {};
//# sourceMappingURL=CommentCreator.d.ts.map