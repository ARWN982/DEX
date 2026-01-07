import { StateField } from "@codemirror/state";
import { DecorationSet, ViewPlugin, ViewUpdate, EditorView } from "@codemirror/view";
export interface GeneratedBlock {
    commentLine: number;
    codeLines: Set<number>;
    editType: 'none' | 'comment' | 'code';
    originalCommentText: string;
}
export declare const addGeneratedBlockEffect: import("@codemirror/state").StateEffectType<{
    commentLine: number;
    codeLines: number[];
    originalCommentText: string;
}>;
export declare const removeGeneratedBlockEffect: import("@codemirror/state").StateEffectType<number>;
export declare const markBlockEditedEffect: import("@codemirror/state").StateEffectType<{
    commentLine: number;
    editType: "comment" | "code";
}>;
export declare const isRegenerationAnnotation: import("@codemirror/state").AnnotationType<boolean>;
export declare const generatedCommentsState: StateField<Map<number, GeneratedBlock>>;
export declare const setCommentHintEffect: import("@codemirror/state").StateEffectType<boolean>;
export declare const commentHintState: StateField<boolean>;
export declare const generateESQLFromPrompt: (prompt: string) => string;
export declare const createHandleGenerate: (editorViewRef: React.RefObject<EditorView | null>, onChange: (value: string) => void, hasCalledEditCallbackRef?: React.MutableRefObject<Set<number>>) => (commentText: string, lineNumber: number) => void;
export declare const createCommentHintPlugin: (textSubdued: string, visorState: StateField<{
    open: boolean;
    pos: number;
}>, commentHintState: StateField<boolean>) => ViewPlugin<{
    decorations: DecorationSet;
    update(update: ViewUpdate): void;
    buildDecorations(view: EditorView): DecorationSet;
}, undefined>;
export declare const createCommentHintDebounceListener: (commentHintTimerRef: React.MutableRefObject<NodeJS.Timeout | null>, editorViewRef: React.RefObject<EditorView | null>) => import("@codemirror/state").Extension;
export declare const createCommentEditDetectionListener: (editedBlocksRef: React.MutableRefObject<Map<number, "comment" | "code">>, commentEditTimerRef: React.MutableRefObject<NodeJS.Timeout | null>, editorViewRef: React.RefObject<EditorView | null>, onChange: (value: string) => void) => import("@codemirror/state").Extension;
export declare const createCommentEditDetectionListenerGutter: (editedBlocksRef: React.MutableRefObject<Map<number, "comment" | "code">>, commentEditTimerRef: React.MutableRefObject<NodeJS.Timeout | null>, editorViewRef: React.RefObject<EditorView | null>, onEditGeneratedCode?: () => void, hasCalledEditCallbackRef?: React.MutableRefObject<Set<number>>) => import("@codemirror/state").Extension;
export declare const createEditMarkerGutter: (commentEditColor: string, codeEditColor: string, isDarkMode: boolean, textDanger?: string, textSuccess?: string) => import("@codemirror/state").Extension[];
//# sourceMappingURL=commentGeneration.d.ts.map