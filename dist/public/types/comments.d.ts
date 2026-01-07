export interface CommentPosition {
    x: number;
    y: number;
    elementId?: string;
    scrollX?: number;
    scrollY?: number;
}
export interface CommentThread {
    id: string;
    position: CommentPosition;
    status: 'open' | 'resolved' | 'closed';
    createdAt: string;
    updatedAt: string;
    projectId?: string;
    versionId?: string;
    pageId?: string;
    comments: Comment[];
}
export interface Comment {
    id: string;
    threadId: string;
    content: string;
    author: CommentAuthor;
    createdAt: string;
    updatedAt?: string;
    parentId?: string;
    reactions?: CommentReaction[];
}
export interface CommentAuthor {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    color?: string;
}
export interface CommentReaction {
    type: 'like' | 'dislike' | 'heart' | 'laugh';
    authorId: string;
    createdAt: string;
}
export interface CommentFormData {
    content: string;
    parentId?: string;
}
export interface CommentState {
    threads: Record<string, CommentThread>;
    activeThreadId: string | null;
    isCreatingComment: boolean;
    pendingPosition: CommentPosition | null;
    currentUser: CommentAuthor | null;
    showResolved: boolean;
}
export type CommentEvent = {
    type: 'CREATE_THREAD';
    payload: {
        position: CommentPosition;
        content: string;
    };
} | {
    type: 'ADD_COMMENT';
    payload: {
        threadId: string;
        content: string;
        parentId?: string;
    };
} | {
    type: 'RESOLVE_THREAD';
    payload: {
        threadId: string;
    };
} | {
    type: 'DELETE_COMMENT';
    payload: {
        threadId: string;
        commentId: string;
    };
} | {
    type: 'SET_ACTIVE_THREAD';
    payload: {
        threadId: string | null;
    };
} | {
    type: 'START_CREATING';
    payload: {
        position: CommentPosition;
    };
} | {
    type: 'CANCEL_CREATING';
} | {
    type: 'TOGGLE_RESOLVED_VISIBILITY';
};
//# sourceMappingURL=comments.d.ts.map