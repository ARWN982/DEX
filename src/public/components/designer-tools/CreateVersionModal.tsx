import { EuiCheckbox, EuiRadio } from "@elastic/eui";
import { X } from "phosphor-react";
import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useVersionStore } from "../../store/useVersionStore";
import { getToolbarColors } from "../../styles/designToolsColors";
import { getComponentFromRegistry } from "../../utils/componentRegistry";
import { getCurrentPage } from "../../utils/pageUtils";

const AnimatedDots: React.FC = () => {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setDotCount((c) => (c % 3) + 1), 400);
    return () => clearInterval(timer);
  }, []);
  return <span style={{ display: "inline-block", minWidth: "1em", textAlign: "left" }}>{".".repeat(dotCount)}</span>;
};

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorMode } = useAppStore();
  const { getCurrentVersion, createVersion, versions } = useVersionStore();
  const colors = getToolbarColors(colorMode);

  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [startFromScratch, setStartFromScratch] = useState(false);
  const [copyComments, setCopyComments] = useState(false);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const lockedVersionRef = useRef<string | null>(null);

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

  const nextVersionNumber = lockedVersionRef.current ?? getNextVersionNumber();

  const handleCreate = async () => {
    lockedVersionRef.current = getNextVersionNumber();
    setIsCreating(true);
    try {
      const newVersionId = await createVersion({
        isMajorVersion,
        startFromScratch,
        copyComments: startFromScratch ? false : copyComments,
        description: description.trim() || undefined,
      });

      // Keep modal open until webpack HMR has the new component ready.
      const pageName = getCurrentPage();
      const maxWait = 10_000;
      const interval = 400;
      let waited = 0;

      while (waited < maxWait) {
        if (getComponentFromRegistry(pageName, newVersionId)) break;
        await new Promise((r) => setTimeout(r, interval));
        waited += interval;
      }

      setIsMajorVersion(false);
      setStartFromScratch(false);
      setCopyComments(false);
      setDescription("");
      lockedVersionRef.current = null;
      onClose();
    } catch (error) {
      console.error("Failed to create version:", error);
      lockedVersionRef.current = null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setIsMajorVersion(false);
      setStartFromScratch(false);
      setCopyComments(false);
      setDescription("");
      lockedVersionRef.current = null;
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
    padding: "20px",
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.primary,
    borderRadius: "16px",
    padding: "0",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.4)",
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: "24px 24px 0 24px",
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
    width: "32px",
    height: "32px",
    borderRadius: "16px",
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
    padding: "24px",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "20px",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: colors.border,
    opacity: 0.5,
    margin: "4px 0 20px 0",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: "8px",
  };

  const previewStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: colors.accent,
    marginBottom: "8px",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "80px",
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  };

  const footerStyle: React.CSSProperties = {
    padding: "0 24px 24px 24px",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
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

  const createButtonDisabledStyle: React.CSSProperties = {
    ...createButtonStyle,
    backgroundColor: colors.textMuted,
    cursor: "default",
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

          <div style={headerStyle}>
            <h2 style={titleStyle}>Create new version</h2>
            <button
              style={closeButtonStyle}
              onClick={handleClose}
              disabled={isCreating}
              onMouseEnter={(e) => {
                if (!isCreating) {
                  (e.target as HTMLElement).style.backgroundColor =
                    colors.buttonHover;
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={contentStyle}>
            {/* Version number + major toggle */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
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
                <div style={{ marginLeft: "24px", marginTop: "8px" }}>
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

              <div style={{ marginTop: "12px" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
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
              style={isCreating ? createButtonDisabledStyle : createButtonStyle}
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
              {isCreating ? <>Creating<AnimatedDots /></> : "Create version"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
