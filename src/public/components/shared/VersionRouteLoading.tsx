import React from "react";
import { useVersionStore } from "../../store/useVersionStore";
import { PageShell } from "./PageShell";

interface VersionRouteLoadingProps {
  pageName: string;
}

/**
 * Loading state for a version route. Renders the same PageShell as
 * the rest of the version flow (project label + version pill on the
 * gradient background) so there's no spinner flash when the active
 * version is still being resolved — for example right after a webpack
 * full reload triggered by creating a new version on disk.
 */
export const VersionRouteLoading: React.FC<VersionRouteLoadingProps> = ({
  pageName,
}) => {
  const currentVersion = useVersionStore((s) => s.currentVersion);

  return <PageShell versionId={currentVersion} pageName={pageName} />;
};
