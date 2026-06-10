import { EuiCheckbox, EuiRadio, useEuiTheme } from "@elastic/eui";
import { X } from "phosphor-react";
import React, { useState, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useVersionStore, type CreateVersionOptions } from "../../store/useVersionStore";
import { getToolbarColors, dtRadius, dtPadding } from "../../styles/designToolsTokens";
import { getComponentFromRegistry } from "../../utils/componentRegistry";
import { getCurrentPage } from "../../utils/pageUtils";
import type { StepConfig } from "../shared/CreationStepRow";

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorMode } = useAppStore();
  const { getCurrentVersion, createVersion, versions, startCreation, updateCreationStep, finishCreation } = useVersionStore();
  const { euiTheme } = useEuiTheme();
  const colors = getToolbarColors(colorMode);

  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [startFromScratch, setStartFromScratch] = useState(false);
  const [copyComments, setCopyComments] = useState(false);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const currentVersion = getCurrentVersion();

  const getNextVersionNumber = () => {
    const highest = versions.length > 0
      ? versions
          .map((v) => v.id)
          .sort((a, b) => {
            const [aMaj, aMin] = a.split(".").map(Number);
            const [bMaj, bMin] = b.split(".").map(Number);
            return aMaj !== bMaj ? bMaj - aMaj : bMin - aMin;
          })[0]
      : "1.0";
    const [major, minor] = highest.split(".").map(Number);

    if (isMajorVersion) {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  };

  const nextVersionNumber = getNextVersionNumber();

  const getSteps = useCallback((): StepConfig[] => {
    const ver = nextVersionNumber;
    const currVer = currentVersion?.id || "1.0";
    return [
      {
        activeLabel: `Scaffolding v${ver} files`,
        doneLabel: `v${ver} files ready`,
      },
      {
        activeLabel: startFromScratch
          ? "Setting up blank canvas"
          : `Copying design from v${currVer}`,
        doneLabel: startFromScratch
          ? "Blank canvas ready"
          : `Design copied from v${currVer}`,
      },
      {
        activeLabel: "Registering version",
        doneLabel: "Version registered",
      },
    ];
  }, [nextVersionNumber, currentVersion, startFromScratch]);

  const handleCreate = async () => {
    const versionId = getNextVersionNumber();
    const steps = getSteps();
    const opts = {
      isMajorVersion,
      startFromScratch,
      copyComments: startFromScratch ? false : copyComments,
      description: description.trim() || undefined,
    };

    setIsCreating(true);

    // Signal the store so the inline page appears immediately
    startCreation(versionId, steps);

    // Close the modal right away — progress is shown inline
    resetForm();
    onClose();

    // Run creation + step orchestration in the background
    orchestrateCreation(versionId, opts, updateCreationStep, finishCreation);
  };

  const resetForm = () => {
    setIsMajorVersion(false);
    setStartFromScratch(false);
    setCopyComments(false);
    setDescription("");
    setIsCreating(false);
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 3000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: dtPadding,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.primary,
    borderRadius: dtRadius.panel,
    padding: "0",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.4)",
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: `${dtPadding} ${dtPadding} 0 ${dtPadding}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    width: euiTheme.size.xl,
    height: euiTheme.size.xl,
    borderRadius: dtRadius.panel,
    border: "none",
    backgroundColor: "transparent",
    color: colors.textSecondary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const contentStyle: React.CSSProperties = {
    padding: dtPadding,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: dtPadding,
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: colors.border,
    opacity: 0.5,
    margin: `${euiTheme.size.xs} 0 ${dtPadding} 0`,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: euiTheme.size.s,
  };

  const previewStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: colors.accent,
    marginBottom: euiTheme.size.s,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "80px",
    padding: euiTheme.size.m,
    borderRadius: dtRadius.medium,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  };

  const footerStyle: React.CSSProperties = {
    padding: `0 ${dtPadding} ${dtPadding} ${dtPadding}`,
    display: "flex",
    gap: euiTheme.size.m,
    justifyContent: "flex-end",
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: dtRadius.medium,
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "transparent",
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
  };

  const createButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: colors.accent,
    color: "#ffffff",
  };

  return (
    <>
      <div style={overlayStyle} onClick={handleClose}>
        <div className="create-version-modal" style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <style>{`
            .create-version-modal [class*="euiRadio__circle-selected"],
            .create-version-modal [class*="euiCheckbox__square-selected"] {
              background-color: ${colors.accent} !important;
              border-color: ${colors.accent} !important;
            }
          `}</style>

          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyle}>Create new version</h2>
            <button
              style={closeButtonStyle}
              onClick={handleClose}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor =
                  colors.buttonHover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content — form only */}
          <div style={contentStyle}>
            {/* Version number + major toggle */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "baseline", gap: euiTheme.size.m, marginBottom: euiTheme.size.m }}>
                <div style={previewStyle}>Version {nextVersionNumber}</div>
              </div>
              <EuiCheckbox
                id="majorVersion"
                label="Major version"
                checked={isMajorVersion}
                onChange={(e) => setIsMajorVersion(e.target.checked)}
                disabled={isCreating}
              />
            </div>

            <div style={dividerStyle} />

            {/* Starting point */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Starting point</label>

              <EuiRadio
                id="basedOnCurrent"
                label={
                  <span>
                    Based on{" "}
                    <strong>v{currentVersion?.id || "1.0"}</strong>
                  </span>
                }
                checked={!startFromScratch}
                onChange={() => setStartFromScratch(false)}
                disabled={isCreating}
              />

              {!startFromScratch && (
                <div style={{ marginLeft: euiTheme.size.l, marginTop: euiTheme.size.s }}>
                  <EuiCheckbox
                    id="copyComments"
                    label={
                      <span style={{ fontSize: "13px", color: colors.textSecondary }}>
                        Copy comments
                      </span>
                    }
                    checked={copyComments}
                    onChange={(e) => setCopyComments(e.target.checked)}
                    disabled={isCreating}
                  />
                </div>
              )}

              <div style={{ marginTop: euiTheme.size.m }}>
                <EuiRadio
                  id="startFromScratch"
                  label="Start from scratch"
                  checked={startFromScratch}
                  onChange={() => setStartFromScratch(true)}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div style={dividerStyle} />

            {/* Description */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: euiTheme.size.s }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                <span style={{ fontSize: "12px", color: colors.textSecondary }}>Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's new in this version..."
                style={textareaStyle}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button
              style={cancelButtonStyle}
              onClick={handleClose}
              disabled={isCreating}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  (e.target as HTMLElement).style.backgroundColor =
                    colors.buttonHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  (e.target as HTMLElement).style.backgroundColor =
                    "transparent";
                }
              }}
            >
              Cancel
            </button>
            <button
              style={createButtonStyle}
              onClick={handleCreate}
              disabled={isCreating}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  (e.target as HTMLElement).style.backgroundColor = "#0084d1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating) {
                  (e.target as HTMLElement).style.backgroundColor =
                    colors.accent;
                }
              }}
            >
              Create version
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Background orchestration: calls createVersion, polls for HMR, and
 * drives the step animations via the version store.  Runs detached
 * from the modal component (which is already closed).
 */
async function orchestrateCreation(
  versionId: string,
  opts: CreateVersionOptions,
  updateStep: (index: number, status: "pending" | "active" | "complete") => void,
  finish: () => void,
) {
  const { createVersion } = useVersionStore.getState();
  const startTime = Date.now();

  // Cosmetic step timers — these fire regardless of how fast the API is
  const step1Timer = setTimeout(() => {
    updateStep(0, "complete");
    updateStep(1, "active");
  }, 1750);

  const step2Timer = setTimeout(() => {
    updateStep(1, "complete");
    updateStep(2, "active");
  }, 3250);

  try {
    const newVersionId = await createVersion(opts);

    // Wait for HMR / registry to see the new component
    const pageName = getCurrentPage();
    const maxWait = 10_000;
    const interval = 400;
    let waited = 0;

    while (waited < maxWait) {
      if (getComponentFromRegistry(pageName, newVersionId)) break;
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
    }

    // Wait for the visual step timers to play out before finishing.
    // Step 2 timer fires at 3250ms; add buffer for the animation.
    const minElapsed = 3800;
    const remaining = minElapsed - (Date.now() - startTime);
    if (remaining > 0) {
      await new Promise((r) => setTimeout(r, remaining));
    }

    // Complete the final step, then signal done after a brief pause
    updateStep(2, "complete");
    await new Promise((r) => setTimeout(r, 800));
    finish();
  } catch (error) {
    console.error("Failed to create version:", error);
    clearTimeout(step1Timer);
    clearTimeout(step2Timer);
    finish();
  }
}
