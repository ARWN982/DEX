import { EuiEmptyPrompt, EuiLoadingSpinner } from "@elastic/eui";
import React from "react";

interface VersionRouteLoadingProps {
  pageName: string;
}

export const VersionRouteLoading: React.FC<VersionRouteLoadingProps> = ({
  pageName,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <EuiEmptyPrompt
        icon={<EuiLoadingSpinner size="xl" />}
        title={<h2>Loading {pageName}</h2>}
        body={<p>This should only take a moment.</p>}
      />
    </div>
  );
};
