import { Root } from "react-dom/client";
import { WidgetType } from "@codemirror/view";
interface VisorWidgetProps {
    onClose: () => void;
    onSubmit: (prompt: string, language: string) => void;
    euiTheme: any;
    isDarkMode: boolean;
    display?: 'multiLine' | 'singleLine';
}
export declare const createVisorWidget: ({ onClose, onSubmit, euiTheme, isDarkMode, display }: VisorWidgetProps) => {
    new (): {
        root: Root | null;
        toDOM(): HTMLDivElement;
        destroy(): void;
        eq(widget: WidgetType): boolean;
        updateDOM(dom: HTMLElement, view: import("@codemirror/view").EditorView): boolean;
        get estimatedHeight(): number;
        get lineBreaks(): number;
        ignoreEvent(event: Event): boolean;
        coordsAt(dom: HTMLElement, pos: number, side: number): import("@codemirror/view").Rect | null;
    };
};
export {};
//# sourceMappingURL=VisorWidget.d.ts.map