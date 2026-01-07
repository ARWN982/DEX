import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
export declare const esqlCommands: ({
    label: string;
    type: string;
    boost: number;
    apply: (view: any, completion: any, from: number, to: number) => void;
} | {
    label: string;
    type: string;
    boost: number;
    apply?: undefined;
})[];
export declare const indexPatterns: {
    label: string;
    type: string;
    info: string;
}[];
export declare const nextStepSuggestions: {
    label: string;
    type: string;
    boost: number;
    info: string;
    apply: (view: any, completion: any, from: number, to: number) => void;
}[];
export declare function esqlCompletion(context: CompletionContext): CompletionResult | null;
//# sourceMappingURL=esqlAutocompletion.d.ts.map