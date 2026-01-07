"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppContainer = void 0;
const jsx_runtime_1 = require("@emotion/react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("@emotion/react");
const AppContainer = ({ children }) => {
    const euiThemeContext = (0, eui_1.useEuiTheme)();
    return ((0, jsx_runtime_1.jsx)("div", { css: (0, react_1.css) `
        ${(0, eui_1.euiShadow)(euiThemeContext, 'xs')};
        background-color: ${euiThemeContext.euiTheme.colors.emptyShade};
        border-radius: ${euiThemeContext.euiTheme.border.radius.medium};
        border: 1px solid ${euiThemeContext.euiTheme.colors.borderBaseSubdued};
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `, children: children }));
};
exports.AppContainer = AppContainer;
//# sourceMappingURL=AppContainer.js.map