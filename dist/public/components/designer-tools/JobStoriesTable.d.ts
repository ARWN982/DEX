import React from "react";
export interface JobStory {
    id: string;
    jobStory: string;
    acceptanceCriteria: string;
    implementation: "Pending" | "Done";
}
interface JobStoriesTableProps {
    stories: JobStory[];
    onStoriesChange: (stories: JobStory[]) => void;
}
export declare const JobStoriesTable: React.FC<JobStoriesTableProps>;
export {};
//# sourceMappingURL=JobStoriesTable.d.ts.map