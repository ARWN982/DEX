import { useAppStore, useUpdateRefresh } from '../store/useAppStore';

/**
 * Hook that provides store values without URL synchronization
 * Simplified for prototype - URL syncing removed for production engineering
 */
export const useUrlSyncedStore = () => {
  const store = useAppStore();
  
  // Create update/refresh handler using the store's built-in functions
  const { handleUpdateRefresh, hasChanges } = useUpdateRefresh(store.applyChanges, store.hasChanges);

  return {
    ...store,
    hasChanges, // Use the hasChanges from useUpdateRefresh to avoid calling the function on every render
    handleUpdateRefresh,
  };
};