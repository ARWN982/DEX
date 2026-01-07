import { X } from "phosphor-react";
import React, { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useVersionStore } from "../../store/useVersionStore";
import { getToolbarColors } from "../../styles/designToolsColors";

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorMode } = useAppStore();
  const { getCurrentVersion, createVersion } = useVersionStore();
  const colors = getToolbarColors(colorMode);

  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [startFromScratch, setStartFromScratch] = useState(false);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const currentVersion = getCurrentVersion();

  // Calculate what the next version number will be
  const getNextVersionNumber = () => {
    const current = currentVersion?.id || "1.0";
    const [major, minor] = current.split(".").map(Number);

    if (isMajorVersion) {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  };

  const nextVersionNumber = getNextVersionNumber();
  const versionTypeText = isMajorVersion ? "Major Version" : "Minor Version";

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createVersion({
        isMajorVersion,
        startFromScratch,
        description: description.trim() || undefined,
      });

      // Reset form and close modal
      setIsMajorVersion(false);
      setStartFromScratch(false);
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create version:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      // Reset form state when closing
      setIsMajorVersion(false);
      setStartFromScratch(false);
      setDescription("");
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

  const checkboxContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "12px",
  };

  const checkboxStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    accentColor: colors.accent,
  };

  const radioContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "12px",
  };

  const radioStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    marginTop: "2px",
    accentColor: colors.accent,
  };

  const radioLabelStyle: React.CSSProperties = {
    fontSize: "14px",
    color: colors.textPrimary,
    lineHeight: "1.4",
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
    cursor: "not-allowed",
  };

  return (
    <>
      {/* Backdrop */}
      <div style={overlayStyle} onClick={handleClose}>
        {/* Modal */}
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyle}>Create New Version</h2>
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

          {/* Content */}
          <div style={contentStyle}>
            {/* Version Preview */}
            <div style={sectionStyle}>
              <label style={labelStyle}>New Version</label>
              <div style={previewStyle}>Version {nextVersionNumber}</div>
            </div>

            {/* Version Type */}
            <div style={sectionStyle}>
              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  id="majorVersion"
                  checked={isMajorVersion}
                  onChange={(e) => setIsMajorVersion(e.target.checked)}
                  style={checkboxStyle}
                  disabled={isCreating}
                />
                <label htmlFor="majorVersion" style={labelStyle}>
                  This is a major version
                </label>
              </div>
            </div>

            {/* Base Version Options */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Create From</label>

              <div style={radioContainerStyle}>
                <input
                  type="radio"
                  id="basedOnCurrent"
                  name="baseVersion"
                  checked={!startFromScratch}
                  onChange={() => setStartFromScratch(false)}
                  style={radioStyle}
                  disabled={isCreating}
                />
                <label htmlFor="basedOnCurrent" style={radioLabelStyle}>
                  Based on{" "}
                  <strong>Version {currentVersion?.id || "1.0"}</strong>
                  <br />
                  <span
                    style={{ color: colors.textSecondary, fontSize: "12px" }}
                  >
                    Copy all comments and job stories from current version
                  </span>
                </label>
              </div>

              <div style={radioContainerStyle}>
                <input
                  type="radio"
                  id="startFromScratch"
                  name="baseVersion"
                  checked={startFromScratch}
                  onChange={() => setStartFromScratch(true)}
                  style={radioStyle}
                  disabled={isCreating}
                />
                <label htmlFor="startFromScratch" style={radioLabelStyle}>
                  Start from scratch
                  <br />
                  <span
                    style={{ color: colors.textSecondary, fontSize: "12px" }}
                  >
                    Begin with empty comments and job stories
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Description (Optional)</label>
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
              {isCreating
                ? "Creating..."
                : `Create Version ${nextVersionNumber}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
