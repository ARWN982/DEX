import React from "react";
import { EuiMarkdownFormat } from "@elastic/eui";

interface MarkdownPanelProps {
  content?: string;
}

export const MarkdownPanel: React.FC<MarkdownPanelProps> = ({
  content = "## Markdown Panel\n\nThis is a **markdown** panel. Click the settings icon to edit the content.",
}) => {
  return (
    <EuiMarkdownFormat>{content}</EuiMarkdownFormat>
  );
};
