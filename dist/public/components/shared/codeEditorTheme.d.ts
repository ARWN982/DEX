interface ThemeOptions {
    euiTheme: any;
    colorMode: string;
    isDarkMode: boolean;
    compressed: boolean;
    showFooter: boolean;
}
export declare const createCodeEditorTheme: ({ euiTheme, colorMode, isDarkMode, compressed, showFooter, }: ThemeOptions) => import("@codemirror/state").Extension;
export declare const cleanupCodeEditorStyles: () => void;
export {};
//# sourceMappingURL=codeEditorTheme.d.ts.map