import { EuiContextMenu, EuiPopover, useEuiTheme } from "@elastic/eui";
import { DotsThreeVertical } from "phosphor-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectInfoFlyout, ProjectMetadata, CreateProjectModal } from "../components";
import { useAppStore } from "../store/useAppStore";
import {
  getDesignUIColors,
  createBoxShadow,
  dtRadius,
} from "../styles/designToolsTokens";

interface Project {
  name: string;
  displayName: string;
  latestVersion: string;
  path: string;
  metadata?: ProjectMetadata;
}

interface Template {
  name: string;
  path: string;
  key: string;
  metadata?: {
    templateName: string;
    thumbnail?: {
      filename: string;
      createdAt: string;
      url: string;
    };
  };
}

const isProduction = process.env.VIBE_DEPLOY_MODE === 'production';

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectInfoFlyoutOpen, setIsProjectInfoFlyoutOpen] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const [templatePopoverOpenId, setTemplatePopoverOpenId] = useState<string | null>(null);
  const [templatesWithMetadata, setTemplatesWithMetadata] = useState<Template[]>([]);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [createProjectFromTemplate, setCreateProjectFromTemplate] = useState<{ templateName: string; defaultName: string } | null>(null);

  // For homepage, use main app theme colors
  const colors = getDesignUIColors(colorMode);

  // Define templates
  const templates = [
    { name: "Discover", path: "/templates/discover", key: "discover" },
    { name: "Dashboards", path: "/templates/dashboards", key: "dashboards" },
  ];
  
  useEffect(() => {
    // Dynamically load all projects from the API
    const loadProjects = async () => {
      try {
        console.log('[Homepage] Fetching projects from /api/projects...');
        // Fetch projects from the API
        const response = await fetch('/api/projects');
        console.log('[Homepage] Response status:', response.status, response.ok);
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        console.log('[Homepage] API response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Invalid API response');
        }
        
        if (!data.projects || !Array.isArray(data.projects)) {
          console.warn('[Homepage] No projects array in response:', data);
          setProjects([]);
          setLoading(false);
          return;
        }
        
        console.log('[Homepage] Found', data.projects.length, 'projects');
        
        // Load metadata and latest version for each project
        const projectsWithMetadata = await Promise.all(
          data.projects.map(async (project: any) => {
            const metadata = await loadProjectMetadata(project.name);
            // Use the highest version from the versions array
            const latestVersion = project.versions.length > 0 
              ? `v${project.versions[project.versions.length - 1]}`
              : 'v1.0';
            
            return {
              name: project.name,
              displayName: project.displayName,
              path: `/${project.name}`,
              latestVersion,
              metadata: metadata || undefined,
            };
          })
        );

        console.log('[Homepage] Projects with metadata:', projectsWithMetadata);
        setProjects(projectsWithMetadata);
        setLoading(false);
      } catch (error) {
        console.error("[Homepage] Failed to load projects:", error);
        // Show error message to user
        const errorMessage = error instanceof Error ? error.message : "Failed to load projects";
        console.error("[Homepage] Error details:", errorMessage);
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Load template metadata (skip in production mode)
  useEffect(() => {
    if (isProduction) return;

    const loadTemplateMetadata = async () => {
      try {
        const templatesWithMeta = await Promise.all(
          templates.map(async (template) => {
            try {
              const response = await fetch(`/api/template-metadata/${template.key}`);
              if (response.ok) {
                const metadata = await response.json();
                return { ...template, metadata };
              }
            } catch (error) {
              console.error(`Failed to load metadata for template ${template.key}:`, error);
            }
            return { ...template };
          })
        );
        setTemplatesWithMetadata(templatesWithMeta);
      } catch (error) {
        console.error("Failed to load template metadata:", error);
        setTemplatesWithMetadata(templates);
      }
    };

    loadTemplateMetadata();
  }, []);

  const handleProjectClick = (project: Project) => {
    navigate(project.path);
  };

  const handleTemplateClick = (template: Template) => {
    navigate(template.path);
  };

  const handleUpdateTemplateThumbnail = async (template: Template) => {
    setTemplatePopoverOpenId(null);

    try {
      const response = await fetch(`/api/screenshots/templates/${template.key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Template thumbnail updated successfully:", result);

        // Refresh the templates list to show the new thumbnail
        const refreshedTemplates = await Promise.all(
          templatesWithMetadata.map(async (t) => {
            if (t.key === template.key) {
              try {
                const metadataResponse = await fetch(`/api/template-metadata/${t.key}`);
                if (metadataResponse.ok) {
                  const metadata = await metadataResponse.json();
                  return { ...t, metadata };
                }
              } catch (error) {
                console.error(`Failed to reload metadata for template ${t.key}:`, error);
              }
            }
            return t;
          })
        );
        setTemplatesWithMetadata(refreshedTemplates);
      } else {
        const error = await response.json();
        console.error("Failed to update template thumbnail:", error);
      }
    } catch (error) {
      console.error("Error updating template thumbnail:", error);
    }
  };

  const handleCreateProject = () => {
    setCreateProjectFromTemplate(null);
    setIsCreateProjectModalOpen(true);
  };

  const handleUseTemplate = (template: Template) => {
    setTemplatePopoverOpenId(null);
    setCreateProjectFromTemplate({
      templateName: template.key,
      defaultName: template.key,
    });
    setIsCreateProjectModalOpen(true);
  };

  const handleProjectCreated = async () => {
    // Reload projects list
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectsWithMetadata = await Promise.all(
          data.projects.map(async (project: any) => {
            const latestVersion = await getLatestVersion(project.name);
            const metadata = await loadProjectMetadata(project.name);
            return {
              name: project.name,
              displayName: project.displayName,
              latestVersion,
              path: `/${project.name}`,
              metadata: metadata || undefined,
            };
          })
        );
        setProjects(projectsWithMetadata);
      }
    } catch (error) {
      console.error("Failed to reload projects:", error);
    }
  };

  const loadProjectMetadata = async (
    projectName: string
  ): Promise<ProjectMetadata | null> => {
    try {
      const response = await fetch(`/api/project-metadata/${projectName}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Failed to load metadata for ${projectName}:`, error);
    }
    return null;
  };

  const getLatestVersion = async (projectName: string): Promise<string> => {
    try {
      const response = await fetch(`/api/versions?page=${projectName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.versions && data.versions.length > 0) {
          // Sort versions and get the highest one
          const sortedVersions = data.versions.sort((a: any, b: any) => {
            const aNum = parseFloat(a.id.replace("v", ""));
            const bNum = parseFloat(b.id.replace("v", ""));
            return bNum - aNum; // Descending order
          });
          return sortedVersions[0].id;
        }
      }
    } catch (error) {
      console.error(`Failed to load versions for ${projectName}:`, error);
    }
    return "v1.0"; // Fallback
  };

  const saveProjectMetadata = async (
    projectName: string,
    metadata: ProjectMetadata
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/project-metadata/${projectName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });
      if (!response.ok) {
        throw new Error("Failed to save project metadata");
      }
    } catch (error) {
      console.error(`Failed to save metadata for ${projectName}:`, error);
    }
  };

  const handleEditProjectInfo = (project: Project) => {
    setSelectedProject(project);
    setIsProjectInfoFlyoutOpen(true);
    setPopoverOpenId(null);
  };

  const handleUpdateThumbnail = async (project: Project) => {
    setPopoverOpenId(null);

    try {
      const response = await fetch(`/api/screenshots/${project.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Thumbnail updated successfully:", result);

        // Refresh the projects list to show the new thumbnail
        const refreshedProjects = await Promise.all(
          projects.map(async (p) => {
            if (p.name === project.name) {
              const metadata = await loadProjectMetadata(p.name);
              return { ...p, metadata: metadata || undefined };
            }
            return p;
          })
        );
        setProjects(refreshedProjects);
      } else {
        const error = await response.json();
        console.error("Failed to update thumbnail:", error);
      }
    } catch (error) {
      console.error("Error updating thumbnail:", error);
    }
  };

  const handleSaveProjectMetadata = async (metadata: ProjectMetadata) => {
    if (selectedProject) {
      await saveProjectMetadata(selectedProject.name, metadata);
      // Update the project in the local state
      setProjects((prev) =>
        prev.map((p) =>
          p.name === selectedProject.name ? { ...p, metadata } : p
        )
      );
    }
  };

  const cardStyle = {
    backgroundColor: colors.primary,
    border: `1px solid ${colors.border}`,
    borderRadius: dtRadius.panel,
    padding: "0px",
    height: "256px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "flex-start",
    boxShadow: createBoxShadow(colors, "light"),
    overflow: "hidden",
  };

  const cardHoverStyle = {
    ...cardStyle,
    transform: "translateY(-2px)",
    boxShadow: `0 ${euiTheme.size.xs} ${euiTheme.size.base} ${colors.shadowLight}`,
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: euiTheme.size.xl,
  };

  const cardTitleStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: "2px",
  };

  const cardSubtitleStyle = {
    fontSize: "12px",
    color: colors.textSecondary,
  };

  const emptyStateStyle = {
    textAlign: "center" as const,
    padding: "64px 0",
  };

  const emptyTextStyle = {
    fontSize: "16px",
    color: colors.textSecondary,
    marginBottom: euiTheme.size.l,
  };

  const createButtonStyle = {
    backgroundColor: colors.primaryButton,
    color: colors.primaryButtonText,
    border: "none",
    borderRadius: dtRadius.pill,
    padding: `${euiTheme.size.m} ${euiTheme.size.l}`,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const containerStyle = {
    maxWidth: `${euiTheme.breakpoint.xl}px`,
    margin: "0 auto",
    padding: `96px ${euiTheme.size.l} ${euiTheme.size.xxxl} ${euiTheme.size.l}`,
    minHeight: "100vh",
  };

  const sectionStyle = {
    marginBottom: "64px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(1, 1fr)",
    gap: euiTheme.size.l,
    marginTop: euiTheme.size.l,
  };

  console.log('[Homepage Render] State:', { loading, projectsCount: projects.length, projects });

  return (
    <div style={containerStyle}>
      <style>{`
        .homepage-card-grid {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: ${euiTheme.breakpoint.m}px) {
          .homepage-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: ${euiTheme.breakpoint.xl}px) {
          .homepage-card-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      {/* Your projects section */}
      <div style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: euiTheme.size.l,
          }}
        >
          <h1 style={{ ...titleStyle, marginBottom: 0 }}>Your projects</h1>
          {!isProduction && !loading && projects.length > 0 && (
            <button
              style={createButtonStyle}
              onClick={handleCreateProject}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Create project
            </button>
          )}
        </div>

        {loading ? (
          <div style={emptyStateStyle}>
            <div style={emptyTextStyle}>Loading projects...</div>
          </div>
        ) : projects.length > 0 ? (
          <div className="homepage-card-grid" style={{ ...gridStyle, marginTop: 0 }}>
            {projects.map((project) => {
              const isHovered = hoveredProjectId === project.name;
              const isPopoverOpen = popoverOpenId === project.name;

              return (
                <div
                  key={project.name}
                  style={{
                    ...cardStyle,
                    position: "relative",
                    ...(isHovered || isPopoverOpen ? cardHoverStyle : {}),
                  }}
                  onClick={() => handleProjectClick(project)}
                  onMouseEnter={() => setHoveredProjectId(project.name)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                >
                  {/* Thumbnail Section */}
                  <div
                    style={{
                      height: "200px",
                      backgroundColor: colors.secondary,
                      borderRadius: `${dtRadius.panel} ${dtRadius.panel} 0 0`,
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {project.metadata?.thumbnail ? (
                      <img
                        src={project.metadata.thumbnail.url}
                        alt={`${project.displayName} thumbnail`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          color: colors.textMuted,
                          fontSize: "14px",
                          textAlign: "center",
                          padding: euiTheme.size.l,
                        }}
                      >
                        No thumbnail available
                        <br />
                        <small>Click "Update thumbnail" to generate one</small>
                      </div>
                    )}
                  </div>

                  {/* Project Info Section */}
                  <div
                    style={{
                      padding: `${euiTheme.size.m} ${euiTheme.size.base}`,
                      height: "56px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={cardTitleStyle}>{project.displayName}</div>
                      <div style={cardSubtitleStyle}>
                        Latest version {project.latestVersion}
                      </div>
                    </div>
                  </div>

                  {/* Three dots menu - only visible on hover */}
                  {(isHovered || isPopoverOpen) && (
                    <div
                      style={{
                        position: "absolute",
                        top: euiTheme.size.s,
                        right: euiTheme.size.s,
                        zIndex: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderRadius: dtRadius.medium,
                        backdropFilter: `blur(${euiTheme.size.s})`,
                      }}
                    >
                      <EuiPopover
                        isOpen={isPopoverOpen}
                        panelPaddingSize="none"
                        closePopover={() => setPopoverOpenId(null)}
                        button={
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: euiTheme.size.xs,
                              borderRadius: dtRadius.small,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff", // White for better contrast
                              opacity: 0.9,
                              transition: "opacity 0.2s ease",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopoverOpenId(
                                isPopoverOpen ? null : project.name
                              );
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "0.7";
                            }}
                          >
                            <DotsThreeVertical size={24} weight="bold" />
                          </button>
                        }
                      >
                        <EuiContextMenu
                          initialPanelId={0}
                          panels={[
                            {
                              id: 0,
                              items: [
                                {
                                  name: "Edit info",
                                  icon: "pencil",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleEditProjectInfo(project);
                                  },
                                },
                                {
                                  name: "Update thumbnail",
                                  icon: "image",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleUpdateThumbnail(project);
                                  },
                                },
                              ],
                            },
                          ]}
                        />
                      </EuiPopover>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={emptyStateStyle}>
            <div style={emptyTextStyle}>
              {isProduction ? "No projects available" : "You haven't created any projects yet"}
            </div>
            {!isProduction && (
              <button
                style={createButtonStyle}
                onClick={handleCreateProject}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Create a project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Templates section (hidden in production mode) */}
      {!isProduction && <div style={sectionStyle}>
        <h2 style={titleStyle}>Templates</h2>
        <div className="homepage-card-grid" style={gridStyle}>
          {templatesWithMetadata.length > 0 ? templatesWithMetadata.map((template) => {
            const isHovered = templatePopoverOpenId === template.key;
            const isPopoverOpen = templatePopoverOpenId === template.key;

            return (
              <div
                key={template.name}
                style={{
                  ...cardStyle,
                  position: "relative",
                  ...(isHovered || isPopoverOpen ? cardHoverStyle : {}),
                }}
                onClick={() => handleTemplateClick(template)}
                onMouseEnter={() => setTemplatePopoverOpenId(template.key)}
                onMouseLeave={() => setTemplatePopoverOpenId(null)}
              >
                {/* Thumbnail Section */}
                <div
                  style={{
                    height: "200px",
                    backgroundColor: colors.secondary,
                    borderRadius: `${dtRadius.panel} ${dtRadius.panel} 0 0`,
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {template.metadata?.thumbnail ? (
                    <img
                      src={template.metadata.thumbnail.url}
                      alt={`${template.name} thumbnail`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        color: colors.textMuted,
                        fontSize: "14px",
                        textAlign: "center",
                        padding: euiTheme.size.l,
                      }}
                    >
                      No thumbnail available
                      <br />
                      <small>Click "Update thumbnail" to generate one</small>
                    </div>
                  )}
                </div>

                {/* Template Info Section */}
                <div
                  style={{
                    padding: `${euiTheme.size.m} ${euiTheme.size.base}`,
                    height: "56px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={cardTitleStyle}>{template.name}</div>
                  </div>
                </div>

                {/* Three dots menu - only visible on hover */}
                {(isHovered || isPopoverOpen) && (
                  <div
                    style={{
                      position: "absolute",
                      top: euiTheme.size.s,
                      right: euiTheme.size.s,
                      zIndex: 10,
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      borderRadius: dtRadius.medium,
                      backdropFilter: `blur(${euiTheme.size.s})`,
                    }}
                  >
                    <EuiPopover
                      isOpen={isPopoverOpen}
                      panelPaddingSize="none"
                      closePopover={() => setTemplatePopoverOpenId(null)}
                      button={
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: euiTheme.size.xs,
                            borderRadius: dtRadius.small,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            opacity: 0.9,
                            transition: "opacity 0.2s ease",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplatePopoverOpenId(
                              isPopoverOpen ? null : template.key
                            );
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.7";
                          }}
                        >
                          <DotsThreeVertical size={24} weight="bold" />
                        </button>
                      }
                    >
                      <EuiContextMenu
                        initialPanelId={0}
                        panels={[
                          {
                            id: 0,
                            items: [
                              {
                                name: "Use this template",
                                icon: "plusInCircle",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  handleUseTemplate(template);
                                },
                              },
                              {
                                name: "Update thumbnail",
                                icon: "image",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  handleUpdateTemplateThumbnail(template);
                                },
                              },
                            ],
                          },
                        ]}
                      />
                    </EuiPopover>
                  </div>
                )}
              </div>
            );
          }) : templates.map((template) => {
            const isHovered = templatePopoverOpenId === template.key;
            const isPopoverOpen = templatePopoverOpenId === template.key;

            return (
              <div
                key={template.name}
                style={{
                  ...cardStyle,
                  position: "relative",
                  ...(isHovered || isPopoverOpen ? cardHoverStyle : {}),
                }}
                onClick={() => handleTemplateClick(template as Template)}
                onMouseEnter={() => setTemplatePopoverOpenId(template.key)}
                onMouseLeave={() => setTemplatePopoverOpenId(null)}
              >
                {/* Thumbnail Section - placeholder */}
                <div
                  style={{
                    height: "200px",
                    backgroundColor: colors.secondary,
                    borderRadius: `${dtRadius.panel} ${dtRadius.panel} 0 0`,
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      color: colors.textMuted,
                      fontSize: "14px",
                      textAlign: "center",
                      padding: euiTheme.size.l,
                    }}
                  >
                    Template screenshot
                    <br />
                    <small>Coming soon</small>
                  </div>
                </div>

                {/* Template Info Section */}
                <div
                  style={{
                    padding: `${euiTheme.size.m} ${euiTheme.size.base}`,
                    height: "56px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={cardTitleStyle}>{template.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Project Info Flyout */}
      <ProjectInfoFlyout
        isOpen={isProjectInfoFlyoutOpen}
        onClose={() => {
          setIsProjectInfoFlyoutOpen(false);
          setSelectedProject(null);
        }}
        projectPath={selectedProject?.path || ""}
        projectMetadata={selectedProject?.metadata || null}
        onSave={handleSaveProjectMetadata}
      />

      {/* Create Project Modal (hidden in production mode) */}
      {!isProduction && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => {
            setIsCreateProjectModalOpen(false);
            setCreateProjectFromTemplate(null);
          }}
          onSuccess={handleProjectCreated}
          templateName={createProjectFromTemplate?.templateName}
          defaultProjectName={createProjectFromTemplate?.defaultName}
        />
      )}
    </div>
  );
};

export { Homepage };
