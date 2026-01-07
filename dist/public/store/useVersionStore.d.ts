export interface Version {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    basedOn?: string | null;
    isActive: boolean;
}
export interface CreateVersionOptions {
    isMajorVersion?: boolean;
    baseVersionId?: string;
    startFromScratch?: boolean;
    description?: string;
}
interface VersionStore {
    versions: Version[];
    currentVersion: string;
    isLoading: boolean;
    loadVersions: () => Promise<void>;
    setActiveVersion: (versionId: string) => Promise<void>;
    createVersion: (options?: CreateVersionOptions) => Promise<string>;
    getCurrentVersion: () => Version | undefined;
}
export declare const useVersionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<VersionStore>>;
export {};
//# sourceMappingURL=useVersionStore.d.ts.map