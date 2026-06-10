import { useEuiTheme } from "@elastic/eui";
import { PencilSimple, X } from "phosphor-react";
import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { getToolbarColors, dtRadius, dtPadding } from "../../styles/designToolsTokens";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  templateName?: string;
  defaultProjectName?: string;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateName,
  defaultProjectName,
}) => {
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();
  const colors = getToolbarColors(colorMode);

  const [displayName, setDisplayName] = useState(defaultProjectName || "");
  const [slug, setSlug] = useState(toSlug(defaultProjectName || ""));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && defaultProjectName) {
      setDisplayName(defaultProjectName);
      setSlug(toSlug(defaultProjectName));
      setSlugManuallyEdited(false);
    } else if (!isOpen) {
      setDisplayName("");
      setSlug("");
      setSlugManuallyEdited(false);
      setIsEditingSlug(false);
      setDescription("");
      setError(null);
    }
  }, [defaultProjectName, isOpen]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    if (!slugManuallyEdited) {
      setSlug(toSlug(value));
    }
    if (error) setError(null);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    setSlug(raw);
    setSlugManuallyEdited(true);
    if (error) setError(null);
  };

  const handleEditSlugClick = () => {
    setIsEditingSlug(true);
    setTimeout(() => slugInputRef.current?.focus(), 0);
  };

  const handleSlugBlur = () => {
    setIsEditingSlug(false);
    // Clean up trailing/leading dashes on blur
    setSlug((s) => s.replace(/^[-_]+|[-_]+$/g, ""));
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError("Project name is required");
      return;
    }

    const finalSlug = slug || toSlug(displayName);

    if (!finalSlug) {
      setError("Could not derive a valid slug from the project name");
      return;
    }

    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(finalSlug)) {
      setError("Slug can only contain lowercase letters, numbers, hyphens, and underscores");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check for duplicates
      const checkResponse = await fetch(`/api/projects`);
      if (checkResponse.ok) {
        const checkText = await checkResponse.text();
        try {
          const checkData = JSON.parse(checkText);
          const existingProject = checkData.projects?.find(
            (p: any) => p.name === finalSlug
          );
          if (existingProject) {
            setError(`A project with the slug "${finalSlug}" already exists`);
            setIsCreating(false);
            return;
          }
        } catch {
          // Skip duplicate check if response isn't JSON
        }
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalSlug,
          displayName: displayName.trim(),
          description: description.trim() || undefined,
          templateName: templateName,
        }),
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }
        throw new Error("Server returned an invalid response. The project may have been created — try refreshing.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to create project");
      }

      setDisplayName("");
      setSlug("");
      setDescription("");
      setError(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setDisplayName("");
      setSlug("");
      setDescription("");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isDark = colorMode === "dark";
  const finalSlug = slug || toSlug(displayName);
  const canCreate = !isCreating && displayName.trim().length > 0;

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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: euiTheme.size.s,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: euiTheme.size.m,
    borderRadius: dtRadius.medium,
    border: `1px solid ${error ? "#d32f2f" : colors.border}`,
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#d32f2f",
    marginTop: euiTheme.size.xs,
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
    backgroundColor: colors.primaryButton,
    color: colors.primaryButtonText,
  };

  const createButtonDisabledStyle: React.CSSProperties = {
    ...createButtonStyle,
    backgroundColor: colors.textMuted,
    cursor: "not-allowed",
  };

  const slugRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: euiTheme.size.s,
    marginTop: euiTheme.size.s,
  };

  const slugLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: colors.textSecondary,
    flexShrink: 0,
  };

  const slugValueStyle: React.CSSProperties = {
    fontSize: "12px",
    fontFamily: "monospace",
    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
    letterSpacing: "-0.01em",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const slugInputInlineStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: `${euiTheme.size.xs} ${euiTheme.size.s}`,
    borderRadius: dtRadius.small,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    fontSize: "12px",
    fontFamily: "monospace",
    letterSpacing: "-0.01em",
    outline: "none",
  };

  const editSlugButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "2px 4px",
    cursor: "pointer",
    color: colors.textMuted,
    display: "flex",
    alignItems: "center",
    borderRadius: "4px",
    transition: "color 0.15s ease",
    flexShrink: 0,
  };

  return (
    <>
      <div style={overlayStyle} onClick={handleClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyle}>
              {templateName
                ? `Create project from ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template`
                : "Create new project"}
            </h2>
            <button
              style={closeButtonStyle}
              onClick={handleClose}
              disabled={isCreating}
              onMouseEnter={(e) => {
                if (!isCreating)
                  (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
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
            {/* Display name */}
            <div style={sectionStyle}>
              <label style={labelStyle}>
                Project name <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={handleDisplayNameChange}
                placeholder="Security onboarding"
                style={inputStyle}
                disabled={isCreating}
                autoFocus
              />
              {error && <div style={errorStyle}>{error}</div>}

              {/* Slug row */}
              <div style={slugRowStyle}>
                <span style={slugLabelStyle}>Slug</span>
                {isEditingSlug ? (
                  <input
                    ref={slugInputRef}
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    onBlur={handleSlugBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        handleSlugBlur();
                      }
                    }}
                    style={slugInputInlineStyle}
                    disabled={isCreating}
                  />
                ) : (
                  <>
                    <span style={slugValueStyle}>
                      {finalSlug || <span style={{ opacity: 0.4 }}>—</span>}
                    </span>
                    <button
                      style={editSlugButtonStyle}
                      onClick={handleEditSlugClick}
                      disabled={isCreating}
                      title="Edit slug"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = colors.textPrimary;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = colors.textMuted;
                      }}
                    >
                      <PencilSimple size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this project is about..."
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
                if (!isCreating)
                  (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
              }}
              onMouseLeave={(e) => {
                if (!isCreating)
                  (e.target as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
            <button
              style={canCreate ? createButtonStyle : createButtonDisabledStyle}
              onClick={handleCreate}
              disabled={!canCreate}
              onMouseEnter={(e) => {
                if (canCreate)
                  (e.target as HTMLElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                if (canCreate)
                  (e.target as HTMLElement).style.transform = "scale(1)";
              }}
            >
              {isCreating ? "Creating..." : "Create project"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
