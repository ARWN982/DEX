import React from "react";
import { EuiText } from "@elastic/eui";

interface TextPanelProps {
  title?: string;
  content?: string;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  title = "Text Panel",
  content = "This is a text panel. You can customize the content here.",
}) => {
  return (
    <div>
      <EuiText>
        <h3 style={{ marginBottom: "8px" }}>{title}</h3>
        <p>{content}</p>
      </EuiText>
    </div>
  );
};
