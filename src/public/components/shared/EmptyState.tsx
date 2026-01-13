import { EuiEmptyPrompt, EuiCode, EuiPage, EuiPageBody } from "@elastic/eui";
import React from "react";

interface EmptyStateProps {
  pageName: string;
  versionId: string;
}

// Add a static property to identify EmptyState components
export const EmptyState: React.FC<EmptyStateProps> & { isEmptyState?: boolean } = ({
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
    <EuiPage style={{ minHeight: "100vh" }}>
      <EuiPageBody>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "40px",
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
      </EuiPageBody>
    </EuiPage>
  );
};

// Mark this component as an empty state
EmptyState.isEmptyState = true;
