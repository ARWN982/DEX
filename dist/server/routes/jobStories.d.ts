declare const router: import("express-serve-static-core").Router;
export interface JobStory {
    id: string;
    jobStory: string;
    acceptanceCriteria: string;
    implementation: "Pending" | "Done";
    createdAt?: string;
}
export default router;
//# sourceMappingURL=jobStories.d.ts.map