// Comment system types for click-to-create functionality

export interface CommentPosition {
  x: number; // X coordinate relative to the viewport or container
  y: number; // Y coordinate relative to the viewport or container
  elementId?: string; // Optional ID of the element the comment is attached to
  scrollX?: number; // Scroll position when comment was created
  scrollY?: number; // Scroll position when comment was created
}

export interface CommentThread {
  id: string;
  position: CommentPosition;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  projectId?: string; // For multi-project support
  versionId?: string; // For version/iteration support
  pageId?: string; // For page-specific support
  comments: Comment[];
}

export interface Comment {
  id: string;
  threadId: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // For nested replies
  reactions?: CommentReaction[];
}

export interface CommentAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color?: string; // For visual differentiation
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

// Events for comment interactions
export type CommentEvent = 
  | { type: 'CREATE_THREAD'; payload: { position: CommentPosition; content: string } }
  | { type: 'ADD_COMMENT'; payload: { threadId: string; content: string; parentId?: string } }
  | { type: 'RESOLVE_THREAD'; payload: { threadId: string } }
  | { type: 'DELETE_COMMENT'; payload: { threadId: string; commentId: string } }
  | { type: 'SET_ACTIVE_THREAD'; payload: { threadId: string | null } }
  | { type: 'START_CREATING'; payload: { position: CommentPosition } }
  | { type: 'CANCEL_CREATING' }
  | { type: 'TOGGLE_RESOLVED_VISIBILITY' };