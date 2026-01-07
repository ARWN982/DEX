"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChartTheme = void 0;
const react_1 = require("react");
/**
 * Hook that dynamically loads the appropriate Elastic Charts theme CSS
 * from local files served from the public directory
 */
const useChartTheme = (colorMode) => {
    (0, react_1.useEffect)(() => {
        // Remove existing chart theme stylesheets
        const existingLinks = document.querySelectorAll('link[data-chart-theme]');
        existingLinks.forEach(link => link.remove());
        // Add the appropriate theme stylesheet from local files
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.setAttribute('data-chart-theme', colorMode);
        link.href = colorMode === 'light'
            ? '/css/theme_only_light.css'
            : '/css/theme_only_dark.css';
        document.head.appendChild(link);
        // Cleanup function
        return () => {
            const currentLink = document.querySelector(`link[data-chart-theme="${colorMode}"]`);
            if (currentLink) {
                currentLink.remove();
            }
        };
    }, [colorMode]);
};
exports.useChartTheme = useChartTheme;
//# sourceMappingURL=useChartTheme.js.map