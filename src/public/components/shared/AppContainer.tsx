/** @jsxImportSource @emotion/react */
import React from "react";
import { useEuiTheme } from "@elastic/eui";
import { css } from "@emotion/react";
import { useAppStore } from "../../store/useAppStore";

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  const euiThemeContext = useEuiTheme();
  const { colorMode } = useAppStore();
  const isDarkMode = colorMode === "dark";

  return (
    <div className="app-container"
      css={css`
        box-shadow: rgba(43, 57, 79, 0.16) 0px 0px 2px 0px, rgba(43, 57, 79, 0.06) 0px 1px 4px 0px, rgba(43, 57, 79, 0.04) 0px 2px 8px 0px;
        background-color: ${euiThemeContext.euiTheme.colors.emptyShade};
        border-radius: ${euiThemeContext.euiTheme.border.radius.medium};
        border: ${isDarkMode ? "1px solid rgb(43, 57, 79)" : "none"};
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0;
        margin: 0;
      `}
    >
      {children}
    </div>
  );
};

