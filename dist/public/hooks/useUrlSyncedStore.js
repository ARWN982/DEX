"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUrlSyncedStore = void 0;
const useAppStore_1 = require("../store/useAppStore");
/**
 * Hook that provides store values without URL synchronization
 * Simplified for prototype - URL syncing removed for production engineering
 */
const useUrlSyncedStore = () => {
    const store = (0, useAppStore_1.useAppStore)();
    // Create update/refresh handler using the store's built-in functions
    const { handleUpdateRefresh, hasChanges } = (0, useAppStore_1.useUpdateRefresh)(store.applyChanges, store.hasChanges);
    return {
        ...store,
        hasChanges, // Use the hasChanges from useUpdateRefresh to avoid calling the function on every render
        handleUpdateRefresh,
    };
};
exports.useUrlSyncedStore = useUrlSyncedStore;
//# sourceMappingURL=useUrlSyncedStore.js.map