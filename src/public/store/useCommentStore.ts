import { create } from 'zustand';
import { CommentState, CommentThread, Comment, CommentPosition, CommentAuthor } from '../types/comments';
import { getCurrentPage } from '../utils/pageUtils';
import { getUserIdentity, updateUserName } from '../utils/userIdentity';

interface CommentStore extends CommentState {
  // State
  isLoading: boolean;
  currentVersion: string;
  currentPage: string;
  lastLoadTime: number;
  
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
  currentVersion: '1.0',
  currentPage: getCurrentPage(),
  lastLoadTime: 0,

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
        
        // Convert array to record for store format
        const threadsRecord = commentThreads.reduce((acc, thread) => {
          acc[thread.id] = { ...thread, versionId, pageId: currentPage };
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

    console.log('addComment called with:', { threadId, content, parentId });
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
      };
    });

    // Auto-save immediately after adding comment to avoid race conditions
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