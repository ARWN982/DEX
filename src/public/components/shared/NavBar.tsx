import React from "react";
import { EuiButtonIcon, EuiIcon, useEuiTheme } from "@elastic/eui";

export type Solution = "o11y" | "security" | "search";

interface NavBarProps {
  solution?: Solution;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onBottomItemClick?: (itemId: string) => void;
}

interface NavItem {
  id: string;
  iconType: string;
  label: string;
  disabled?: boolean;
}

const OBSERVABILITY_NAV_ITEMS: NavItem[] = [
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

const SECURITY_NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    iconType: "securityApp",
    label: "Overview",
  },
  {
    id: "dashboards",
    iconType: "dashboardApp",
    label: "Dashboards",
  },
  {
    id: "alerts",
    iconType: "alert",
    label: "Alerts",
  },
  {
    id: "cases",
    iconType: "casesApp",
    label: "Cases",
  },
  {
    id: "timeline",
    iconType: "timeline",
    label: "Timeline",
  },
  {
    id: "explore",
    iconType: "discoverApp",
    label: "Explore",
  },
  {
    id: "investigate",
    iconType: "search",
    label: "Investigate",
  },
  {
    id: "assets",
    iconType: "node",
    label: "Assets",
  },
  {
    id: "management",
    iconType: "managementApp",
    label: "Management",
  },
];

const SEARCH_NAV_ITEMS: NavItem[] = [
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
    id: "search",
    iconType: "search",
    label: "Search",
  },
  {
    id: "content",
    iconType: "document",
    label: "Content",
  },
  {
    id: "behavioral_analytics",
    iconType: "stats",
    label: "Behavioral Analytics",
  },
  {
    id: "app_search",
    iconType: "appSearchApp",
    label: "App Search",
  },
  {
    id: "workplace_search",
    iconType: "workplaceSearchApp",
    label: "Workplace Search",
  },
  {
    id: "management",
    iconType: "managementApp",
    label: "Management",
  },
];

const getSolutionLogo = (solution: Solution): string => {
  switch (solution) {
    case "o11y":
      return "logoObservability";
    case "security":
      return "logoSecurity";
    case "search":
      return "logoEnterpriseSearch";
    default:
      return "logoObservability";
  }
};

const getSolutionNavItems = (solution: Solution): NavItem[] => {
  switch (solution) {
    case "o11y":
      return OBSERVABILITY_NAV_ITEMS;
    case "security":
      return SECURITY_NAV_ITEMS;
    case "search":
      return SEARCH_NAV_ITEMS;
    default:
      return OBSERVABILITY_NAV_ITEMS;
  }
};

const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    id: "add",
    iconType: "plusInCircle",
    label: "Add",
  },
  {
    id: "code",
    iconType: "code",
    label: "Code",
  },
  {
    id: "info",
    iconType: "info",
    label: "Information",
  },
  {
    id: "settings",
    iconType: "gear",
    label: "Settings",
  },
  {
    id: "collapse",
    iconType: "transitionLeftIn",
    label: "Collapse sidebar",
  },
];

export const NavBar: React.FC<NavBarProps> = ({
  solution = "o11y",
  activeItem,
  onItemClick,
  onBottomItemClick,
}) => {
  const { euiTheme } = useEuiTheme();

  const navItems = getSolutionNavItems(solution);
  const logoType = getSolutionLogo(solution);

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  const handleBottomItemClick = (itemId: string) => {
    if (onBottomItemClick) {
      onBottomItemClick(itemId);
    }
  };

  return (
    <div
      style={{
        width: "48px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "8px",
        paddingBottom: "8px",
        gap: "4px",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo as first item */}
      <div style={{ paddingBottom: euiTheme.size.xs, marginBottom: euiTheme.size.xs }}>
        <EuiIcon type={logoType} size="l" />
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
      
      {/* Main navigation items */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
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
          />
        ))}
      </div>

      {/* Divider line above bottom section */}
      <div
        style={{
          width: "100%",
          paddingLeft: "12px",
          paddingRight: "12px",
          marginTop: euiTheme.size.s,
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

      {/* Bottom section icons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {BOTTOM_NAV_ITEMS.map((item) => (
          <EuiButtonIcon
            key={item.id}
            iconType={item.iconType}
            aria-label={item.label}
            title={item.label}
            size="s"
            color="text"
            onClick={() => handleBottomItemClick(item.id)}
            disabled={item.disabled}
            display="empty"
          />
        ))}
      </div>
    </div>
  );
};
