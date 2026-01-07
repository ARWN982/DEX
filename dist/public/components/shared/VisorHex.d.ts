import React from "react";
interface VisorHexProps {
    isDarkMode?: boolean;
    euiTheme?: any;
    onClose?: () => void;
    onSubmit?: (prompt: string, language: string, dataSource: string) => void;
    currentDataSource?: string;
    isGenerating?: boolean;
}
export declare const VisorHex: React.FC<VisorHexProps>;
export {};
//# sourceMappingURL=VisorHex.d.ts.map