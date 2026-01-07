import React from "react";

/**
 * Simple template loader for loading components from the templates directory
 * Unlike versioned components, templates are simpler and don't have versions
 */
export const TemplateLoader: React.FC<{
  templateName: string;
  [key: string]: any;
}> = ({ templateName, ...props }) => {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        // Since dynamic imports might have issues, let's use a more explicit approach
        let module;
        
        switch (templateName) {
          case 'discover':
            module = await import('../templates/discover');
            break;
          default:
            throw new Error(`Unknown template: ${templateName}`);
        }
        
        if (mounted) {
          if (module.default) {
            setComponent(() => module.default);
          } else {
            // Check for named exports
            const namedExports = Object.keys(module).filter(key => key !== 'default');
            if (namedExports.length > 0) {
              // Use the first named export that looks like a component
              const ComponentExport = (module as any)[namedExports[0]];
              if (typeof ComponentExport === 'function') {
                setComponent(() => ComponentExport);
              } else {
                setError(`No valid component found in template: ${templateName}`);
              }
            } else {
              setError(`No exports found in template: ${templateName}`);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Template loading error:', err);
          setError(`Failed to load template ${templateName}: ${err}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [templateName]);

  if (loading) {
    return React.createElement("div", {}, `Loading template ${templateName}...`);
  }

  if (error || !Component) {
    console.error("TemplateLoader error:", error);
    
    return React.createElement(
      "div",
      {
        style: {
          padding: "40px",
          textAlign: "center",
          color: "#666",
          fontSize: "16px",
          lineHeight: "1.6",
        },
      },
      `Template not found: ${templateName}. Check that src/public/templates/${templateName}/index.tsx exists.`
    );
  }

  return React.createElement(Component, props);
};