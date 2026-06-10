import { create } from 'zustand';
import { CommentState, CommentThread, Comment, CommentPosition, CommentAuthor } from '../types/comments';
import { getCurrentPage } from '../utils/pageUtils';
import { getUserIdentity, updateUserName } from '../utils/userIdentity';

interface CommentStore extends CommentState {
  // State
  isLoading: boolean;
  isSaving: boolean;
  currentVersion: string;
  currentPage: string;
  lastLoadTime: number;
  lastAddedComment: { threadId: string; content: string; timestamp: number } | null;
  
  // Actions
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
  updateAuthorName: (newName: string) => void;
  
  // Computed/Derived state
  getVisibleThreads: () => CommentThread[];
  getThreadAtPosition: (x: number, y: number, tolerance?: number) => CommentThread | null;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  // Initial state
  threads: {},
  activeThreadId: null,
  isCreatingComment: false,
  pendingPosition: null,
  currentUser: getUserIdentity(),
  showResolved: true,
  isLoading: false,
  isSaving: false,
  currentVersion: '1.0',
  currentPage: getCurrentPage(),
  lastLoadTime: 0,
  lastAddedComment: null,

  // Actions
  loadComments: async (versionId: string, pageId?: string) => {
    const currentPage = pageId || getCurrentPage();
    const { currentVersion, lastLoadTime } = get();
    
    // Debounce: don't load if we just loaded in the last 500ms
    const now = Date.now();
    if (now - lastLoadTime < 500) {
      console.log('Debouncing loadComments call for', versionId);
      return;
    }
    
    // Only update currentVersion if it's different, to avoid conflicts
    if (currentVersion !== versionId) {
      set({ isLoading: true, currentPage, currentVersion: versionId, lastLoadTime: now });
    } else {
      set({ isLoading: true, currentPage, lastLoadTime: now });
    }
    try {
      console.log('Loading comments for page', currentPage, 'version', versionId);
      const response = await fetch(`/api/comments?page=${currentPage}&version=${versionId}`);
      if (response.ok) {
        const commentThreads: CommentThread[] = await response.json();
        console.log('Loaded', commentThreads.length, 'comment threads for', currentPage, 'v' + versionId);
        
        const threadsRecord = commentThreads.reduce((acc, thread) => {
          const seen = new Set<string>();
          const dedupedComments = thread.comments.filter(c => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
          acc[thread.id] = { ...thread, versionId, pageId: currentPage, comments: dedupedComments };
          return acc;
        }, {} as Record<string, CommentThread>);
        
        set({ threads: threadsRecord, isLoading: false });
      } else {
        console.error('Failed to load comments');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      set({ isLoading: false });
    }
  },

  saveComments: async () => {
    const { threads, currentVersion, currentPage } = get();
    set({ isSaving: true });
    try {
      console.log('Saving comments for', currentPage, 'v' + currentVersion);
      const threadsArray = Object.values(threads);
      
      const response = await fetch(`/api/comments?page=${currentPage}&version=${currentVersion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threadsArray),
      });
      
      if (response.ok) {
        console.log('Successfully saved comments for', currentPage, 'v' + currentVersion);
      } else {
        console.error('Failed to save comments');
      }
    } catch (error) {
      console.error('Error saving comments:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  setCurrentVersion: (versionId: string) => {
    const currentVersion = get().currentVersion;
    if (currentVersion !== versionId) {
      // Auto-save current version's comments before switching
      get().saveComments();
      // Update the current version in state
      set({ currentVersion: versionId });
      // Load new version's comments
      get().loadComments(versionId);
    }
  },

  createThread: (position: CommentPosition, content: string) => {
    const author = getUserIdentity();
    if (!author) return;

    const { currentVersion } = get();
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const comment: Comment = {
      id: commentId,
      threadId,
      content,
      author,
      createdAt: new Date().toISOString(),
    };

    const thread: CommentThread = {
      id: threadId,
      position,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionId: currentVersion,
      comments: [comment],
    };

    set(state => ({
      threads: {
        ...state.threads,
        [threadId]: thread,
      },
      isCreatingComment: false,
      pendingPosition: null,
      activeThreadId: null, // Don't auto-open the thread after creation
    }));

    // Auto-save immediately after creating thread to avoid race conditions
    get().saveComments();
  },

  addComment: (threadId: string, content: string, parentId?: string) => {
    const author = getUserIdentity();
    if (!author) return;

    // Guard against rapid duplicate submissions (same thread + content within 2s)
    const { lastAddedComment } = get();
    const now = Date.now();
    if (
      lastAddedComment &&
      lastAddedComment.threadId === threadId &&
      lastAddedComment.content === content &&
      now - lastAddedComment.timestamp < 2000
    ) {
      console.log('Ignoring duplicate addComment call');
      return;
    }

    const commentId = `comment-${now}-${Math.random().toString(36).substr(2, 9)}`;
    
    const comment: Comment = {
      id: commentId,
      threadId,
      content,
      author,
      createdAt: new Date().toISOString(),
      parentId,
    };

    set(state => {
      const thread = state.threads[threadId];
      if (!thread) return state;

      return {
        threads: {
          ...state.threads,
          [threadId]: {
            ...thread,
            comments: [...thread.comments, comment],
            updatedAt: new Date().toISOString(),
          },
        },
        lastAddedComment: { threadId, content, timestamp: now },
      };
    });

    get().saveComments();
  },

  resolveThread: (threadId: string) => {
    set(state => {
      const thread = state.threads[threadId];
      if (!thread) return state;

      return {
        threads: {
          ...state.threads,
          [threadId]: {
            ...thread,
            status: 'resolved',
            updatedAt: new Date().toISOString(),
          },
        },
        activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
      };
    });

    // Auto-save after resolving thread
    setTimeout(() => get().saveComments(), 100);
  },

  deleteComment: (threadId: string, commentId: string) => {
    set(state => {
      const thread = state.threads[threadId];
      if (!thread) return state;

      const updatedComments = thread.comments.filter(c => c.id !== commentId);
      
      // If no comments left, remove the thread
      if (updatedComments.length === 0) {
        const { [threadId]: removed, ...remainingThreads } = state.threads;
        return {
          threads: remainingThreads,
          activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
        };
      }

      return {
        threads: {
          ...state.threads,
          [threadId]: {
            ...thread,
            comments: updatedComments,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId });
  },

  startCreating: (position: CommentPosition) => {
    set({
      isCreatingComment: true,
      pendingPosition: position,
      activeThreadId: null,
    });
  },

  cancelCreating: () => {
    set({
      isCreatingComment: false,
      pendingPosition: null,
    });
  },

  toggleResolvedVisibility: () => {
    set(state => ({ showResolved: !state.showResolved }));
  },

  updateAuthorName: (newName: string) => {
    const updatedAuthor = updateUserName(newName);
    const { threads } = get();
    const updatedThreads: Record<string, CommentThread> = {};

    for (const [id, thread] of Object.entries(threads)) {
      updatedThreads[id] = {
        ...thread,
        comments: thread.comments.map(comment =>
          comment.author.id === updatedAuthor.id
            ? { ...comment, author: { ...comment.author, name: updatedAuthor.name, color: updatedAuthor.color } }
            : comment
        ),
      };
    }

    set({ threads: updatedThreads, currentUser: updatedAuthor });
    get().saveComments();
  },

  // Computed/Derived state
  getVisibleThreads: () => {
    const state = get();
    const threads = Object.values(state.threads);
    
    if (state.showResolved) {
      return threads;
    }
    
    return threads.filter(thread => thread.status !== 'resolved');
  },

  getThreadAtPosition: (x: number, y: number, tolerance = 20) => {
    const state = get();
    const threads = Object.values(state.threads);
    
    return threads.find(thread => {
      const dx = Math.abs(thread.position.x - x);
      const dy = Math.abs(thread.position.y - y);
      return dx <= tolerance && dy <= tolerance;
    }) || null;
  },
}));