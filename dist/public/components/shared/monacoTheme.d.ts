import type { UseEuiTheme } from '@elastic/eui';
import type { editor } from 'monaco-editor';
export declare function buildEsqlTheme({ euiTheme }: UseEuiTheme, backgroundColor?: string): editor.IStandaloneThemeData;
export declare function registerLanguageThemeResolver(languageId: string, themeResolver: (euiTheme: UseEuiTheme) => editor.IStandaloneThemeData): void;
export declare function getThemeResolver(languageId: string): ((euiTheme: UseEuiTheme) => editor.IStandaloneThemeData) | undefined;
export declare function initializeESQLLanguage(): void;
export declare const buildTheme: typeof buildEsqlTheme;
export declare const buildTransparentTheme: (euiTheme: UseEuiTheme) => editor.IStandaloneThemeData;
//# sourceMappingURL=monacoTheme.d.ts.map