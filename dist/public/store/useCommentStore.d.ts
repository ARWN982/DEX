import { CommentState, CommentThread, CommentPosition } from '../types/comments';
interface CommentStore extends CommentState {
    isLoading: boolean;
    currentVersion: string;
    currentPage: string;
    lastLoadTime: number;
    loadComments: (versionId: string, pageId?: string) => Promise<void>;
    saveComments: () => Promise<void>;
    setCurrentVersion: (versionId: string) => void;
    createThread: (position: CommentPosition, content: string) => void;
    addComment: (threadId: string, content: string, parentId?: string) => void;
    resolveThread: (threadId: string) => void;
    deleteComment: (threadId: string, commentId: string) => void;
    setActiveThread: (threadId: string | null) => void;
    startCreating: (position: CommentPosition) => void;
    cancelCreating: () => void;
    toggleResolvedVisibility: () => void;
    getVisibleThreads: () => CommentThread[];
    getThreadAtPosition: (x: number, y: number, tolerance?: number) => CommentThread | null;
}
export declare const useCommentStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CommentStore>>;
export {};
//# sourceMappingURL=useCommentStore.d.ts.map