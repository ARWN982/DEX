import { EuiEmptyPrompt, EuiCode } from "@elastic/eui";
import React from "react";

interface EmptyStateProps {
  pageName: string;
  versionId: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  pageName,
  versionId,
}) => {
  // Convert page name to display format (e.g., "simple-esql" -> "Simple ESQL")
  const getDisplayPageName = (name: string) => {
    // Handle page names by capitalizing first letter and replacing hyphens with spaces
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayName = getDisplayPageName(pageName);
  const filePath = `src/public/pages/${pageName}/v${versionId}/index.tsx`;

  return (
    <div
      style={{
        padding: "40px",
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EuiEmptyPrompt
        title={
          <h2>
            {displayName} v{versionId}
          </h2>
        }
        body={
          <p>
            This page is empty. Add functionality to it by targeting
            <EuiCode>
              {displayName} v{versionId}
            </EuiCode>{" "}
            in your AI agent or by directly editing{" "}
            <EuiCode>{filePath}</EuiCode>
          </p>
        }
      />
    </div>
  );
};
