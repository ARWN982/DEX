import React from "react";
interface KibanaHeaderProps {
    colorMode: "light" | "dark";
    onToggleColorMode: () => void;
    onAssistantClick: () => void;
    isHomepage?: boolean;
    display?: "classic" | "new";
}
export declare const KibanaHeader: React.FC<KibanaHeaderProps>;
export {};
//# sourceMappingURL=KibanaHeader.d.ts.map