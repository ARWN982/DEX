/** @jsxImportSource @emotion/react */
import React from "react";
import { useEuiTheme, euiShadow } from "@elastic/eui";
import { css } from "@emotion/react";

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  const euiThemeContext = useEuiTheme();

  return (
    <div
      css={css`
        ${euiShadow(euiThemeContext, 'xs')};
        background-color: ${euiThemeContext.euiTheme.colors.emptyShade};
        border-radius: ${euiThemeContext.euiTheme.border.radius.medium};
        border: 1px solid ${euiThemeContext.euiTheme.colors.borderBaseSubdued};
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `}
    >
      {children}
    </div>
  );
};

