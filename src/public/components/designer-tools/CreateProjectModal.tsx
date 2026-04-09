import { X } from "phosphor-react";
import React, { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { getToolbarColors } from "../../styles/designToolsColors";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  templateName?: string; // Optional template name to create project from
  defaultProjectName?: string; // Default project name (e.g., template name)
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateName,
  defaultProjectName,
}) => {
  const { colorMode } = useAppStore();
  const colors = getToolbarColors(colorMode);

  const [projectName, setProjectName] = useState(defaultProjectName || "");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update project name when defaultProjectName changes or modal opens
  useEffect(() => {
    if (isOpen && defaultProjectName) {
      setProjectName(defaultProjectName);
    } else if (!isOpen) {
      // Reset when modal closes
      setProjectName("");
      setDescription("");
      setError(null);
    }
  }, [defaultProjectName, isOpen]);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    // Validate project name (alphanumeric, hyphens, underscores only)
    const nameRegex = /^[a-z0-9-_]+$/;
    if (!nameRegex.test(projectName.trim().toLowerCase())) {
      setError("Project name can only contain lowercase letters, numbers, hyphens, and underscores");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const normalizedName = projectName.trim().toLowerCase();

      // Check if project name already exists
      const checkResponse = await fetch(`/api/projects`);
      if (checkResponse.ok) {
        const checkText = await checkResponse.text();
        try {
          const checkData = JSON.parse(checkText);
          const existingProject = checkData.projects?.find(
            (p: any) => p.name === normalizedName
          );
          if (existingProject) {
            setError(`A project with the name "${normalizedName}" already exists`);
            setIsCreating(false);
            return;
          }
        } catch {
          // Server returned non-JSON — skip the duplicate check and let the POST handle it
        }
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
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
      console.log("Project created successfully:", result);

      // Reset form and close modal
      setProjectName("");
      setDescription("");
      setError(null);
      onClose();
      
      // Call success callback to refresh projects list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      setError(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      // Reset form state when closing
      setProjectName("");
      setDescription("");
      setError(null);
      onClose();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectName(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${error ? "#d32f2f" : colors.border}`,
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#d32f2f",
    marginTop: "4px",
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
    backgroundColor: colors.primaryButton,
    color: colors.primaryButtonText,
    borderRadius: "24px",
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
            <h2 style={titleStyle}>
              {templateName ? `Create Project from ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Template` : "Create New Project"}
            </h2>
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
            {/* Project Name */}
            <div style={sectionStyle}>
              <label style={labelStyle}>
                Project Name <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={handleNameChange}
                placeholder="my-new-project"
                style={inputStyle}
                disabled={isCreating}
                autoFocus
              />
              {error && <div style={errorStyle}>{error}</div>}
              <div
                style={{
                  fontSize: "12px",
                  color: colors.textSecondary,
                  marginTop: "4px",
                }}
              >
                Use lowercase letters, numbers, hyphens, and underscores only
              </div>
            </div>

            {/* Description */}
            <div style={sectionStyle}>
              <label style={labelStyle}>Description (Optional)</label>
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
              style={
                isCreating || !projectName.trim()
                  ? createButtonDisabledStyle
                  : createButtonStyle
              }
              onClick={handleCreate}
              disabled={isCreating || !projectName.trim()}
              onMouseEnter={(e) => {
                if (!isCreating && projectName.trim()) {
                  (e.target as HTMLElement).style.transform = "scale(1.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCreating && projectName.trim()) {
                  (e.target as HTMLElement).style.transform = "scale(1)";
                }
              }}
            >
              {isCreating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

