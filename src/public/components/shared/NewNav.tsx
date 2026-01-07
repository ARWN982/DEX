import React from "react";
import { EuiButtonIcon, EuiIcon, useEuiTheme } from "@elastic/eui";

interface NewNavProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

interface NavItem {
  id: string;
  iconType: string;
  label: string;
  disabled?: boolean;
}

export const NewNav: React.FC<NewNavProps> = ({
  activeItem,
  onItemClick,
}) => {
  const { euiTheme } = useEuiTheme();

  const navItems: NavItem[] = [
    {
      id: "discover",
      iconType: "discoverApp",
      label: "Discover",
    },
    {
      id: "dashboard",
      iconType: "dashboardApp",
      label: "Dashboard",
    },
    {
      id: "visualize",
      iconType: "visualizeApp",
      label: "Visualize",
    },
    {
      id: "ml",
      iconType: "machineLearningApp",
      label: "Machine Learning",
    },
    {
      id: "graph",
      iconType: "graphApp",
      label: "Graph",
    },
    {
      id: "logs",
      iconType: "logsApp",
      label: "Logs",
    },
    {
      id: "apm",
      iconType: "apmApp",
      label: "APM",
    },
    {
      id: "uptime",
      iconType: "uptimeApp",
      label: "Uptime",
    },
    {
      id: "siem",
      iconType: "securityApp",
      label: "Security",
    },
    {
      id: "monitoring",
      iconType: "monitoringApp",
      label: "Monitoring",
    },
    {
      id: "management",
      iconType: "managementApp",
      label: "Management",
    },
  ];

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  return (
    <div
      style={{
        width: "48px",
        height: "100vh",
        // backgroundColor: euiTheme.colors.lightestShade,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "8px",
        paddingBottom: "8px",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {/* Logo as first item */}
      <div style={{ paddingBottom: euiTheme.size.xs, marginBottom: euiTheme.size.xs }}>
        <EuiIcon type="logoObservability" size="l" />
      </div>
      
      {/* Divider line below logo */}
      <div
        style={{
          width: "100%",
          paddingLeft: "12px",
          paddingRight: "12px",
          marginBottom: euiTheme.size.xs,
        }}
      >
        <div
          style={{
            width: "24px",
            height: "1px",
            backgroundColor: euiTheme.colors.borderBaseSubdued,
          }}
        />
      </div>
      
      {navItems.map((item) => (
        <EuiButtonIcon
          key={item.id}
          iconType={item.iconType}
          aria-label={item.label}
          title={item.label}
          size="s"
          color={activeItem === item.id ? "primary" : "text"}
          onClick={() => handleItemClick(item.id)}
          disabled={item.disabled}
          display={activeItem === item.id ? "base" : "empty"}
          // style={{
          //   width: "32px",
          //   height: "32px",
          //   backgroundColor: activeItem === item.id
          //     ? euiTheme.colors.primary
          //     : "transparent",
          //   borderRadius: "6px",
          //   ...(activeItem === item.id && {
          //     color: euiTheme.colors.ghost,
          //   }),
          // }}
        />
      ))}
    </div>
  );
};

