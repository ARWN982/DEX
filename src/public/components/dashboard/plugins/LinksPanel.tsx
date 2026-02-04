/** @jsxImportSource @emotion/react */
import React from "react";
import { useEuiTheme, EuiLink } from "@elastic/eui";
import { css } from "@emotion/react";

export interface LinkItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface LinksPanelProps {
  links: LinkItem[];
  /** Display links horizontally or vertically */
  direction?: "horizontal" | "vertical";
  /** Gap between links in pixels */
  gap?: number;
}

export const LinksPanel: React.FC<LinksPanelProps> = ({
  links = [],
  direction = "horizontal",
  gap = 24,
}) => {
  const { euiTheme } = useEuiTheme();

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: ${direction === "horizontal" ? "row" : "column"};
          gap: ${gap}px;
          align-items: ${direction === "horizontal" ? "center" : "flex-start"};
          flex-wrap: wrap;
        `}
      >
      {links.map((link) => (
        <div
          key={link.id}
          css={css`
            position: relative;
            padding-bottom: 8px;
          `}
        >
          <EuiLink
            href={link.href}
            onClick={link.onClick}
            css={css`
              font-size: 14px;
              font-weight: ${link.isActive ? 600 : 400};
              color: ${link.isActive 
                ? euiTheme.colors.primaryText 
                : euiTheme.colors.text} !important;
              text-decoration: none !important;
              
              &:hover {
                text-decoration: none !important;
              }
            `}
          >
            {link.label}
          </EuiLink>
          {link.isActive && (
            <div
              css={css`
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background-color: ${euiTheme.colors.primary};
                border-radius: 1px;
              `}
            />
          )}
        </div>
      ))}
      </div>
    </div>
  );
};
