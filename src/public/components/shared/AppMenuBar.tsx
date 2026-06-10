import React, { useState } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiSplitButton,
  EuiPopover,
  useEuiTheme,
} from "@elastic/eui";

export interface MenuBarButton {
  id: string;
  label: string;
  iconType?: string;
  onClick: () => void;
  isPrimary?: boolean;
  disabled?: boolean;
  isSplitButton?: boolean;
  splitButtonPopoverItems?: Array<{ id: string; label: string; onClick: () => void }>;
  color?: "primary" | "text" | "success" | "warning" | "danger" | "accent" | "accentSecondary" | "neutral" | "risk";
}

export interface MenuBarConfig {
  buttons: MenuBarButton[];
}

export type AppMenuBarConfig = "discover" | "dashboard-view" | "dashboard-edit" | MenuBarConfig;

interface AppMenuBarProps {
  config: AppMenuBarConfig;
  isInsideTabBar?: boolean;
}

const DISCOVER_CONFIG: MenuBarConfig = {
  buttons: [
    {
      id: "new",
      label: "New",
      iconType: "plusInCircle",
      onClick: () => console.log("New clicked"),
    },
    {
      id: "open",
      label: "Open",
      iconType: "folderOpen",
      onClick: () => console.log("Open clicked"),
    },
    {
      id: "share",
      label: "Share",
      iconType: "share",
      onClick: () => console.log("Share clicked"),
    },
    {
      id: "alerts",
      label: "Alerts",
      iconType: "alert",
      onClick: () => console.log("Alerts clicked"),
    },
    {
      id: "more",
      label: "",
      iconType: "boxesVertical",
      onClick: () => console.log("More clicked"),
    },
    {
      id: "save",
      label: "Save",
      iconType: "save",
      onClick: () => console.log("Save clicked"),
      isSplitButton: true,
      splitButtonPopoverItems: [
        { id: "save-as", label: "Save as...", onClick: () => console.log("Save as clicked") },
        { id: "save-copy", label: "Save a copy", onClick: () => console.log("Save copy clicked") },
      ],
    },
  ],
};

const DASHBOARD_VIEW_CONFIG: MenuBarConfig = {
  buttons: [
    {
      id: "fullscreen",
      label: "Full screen",
      iconType: "fullScreen",
      onClick: () => console.log("Full screen clicked"),
    },
    {
      id: "duplicate",
      label: "Duplicate",
      iconType: "copy",
      onClick: () => console.log("Duplicate clicked"),
    },
    {
      id: "export",
      label: "Export",
      iconType: "export",
      onClick: () => console.log("Export clicked"),
    },
    {
      id: "share",
      label: "Share",
      iconType: "share",
      onClick: () => console.log("Share clicked"),
    },
    {
      id: "more",
      label: "",
      iconType: "boxesVertical",
      onClick: () => console.log("More clicked"),
    },
    {
      id: "edit",
      label: "Edit",
      iconType: "pencil",
      onClick: () => console.log("Edit clicked"),
      isPrimary: true,
      color: "text",
    },
  ],
};

const DASHBOARD_EDIT_CONFIG: MenuBarConfig = {
  buttons: [
    {
      id: "save",
      label: "Save",
      iconType: "save",
      onClick: () => console.log("Save clicked"),
    },
    {
      id: "cancel",
      label: "Cancel",
      iconType: "cross",
      onClick: () => console.log("Cancel clicked"),
    },
    {
      id: "share",
      label: "Share",
      iconType: "share",
      onClick: () => console.log("Share clicked"),
    },
    {
      id: "more",
      label: "",
      iconType: "boxesVertical",
      onClick: () => console.log("More clicked"),
    },
  ],
};

const getConfig = (config: AppMenuBarConfig): MenuBarConfig => {
  if (typeof config === "string") {
    switch (config) {
      case "discover":
        return DISCOVER_CONFIG;
      case "dashboard-view":
        return DASHBOARD_VIEW_CONFIG;
      case "dashboard-edit":
        return DASHBOARD_EDIT_CONFIG;
      default:
        return DISCOVER_CONFIG;
    }
  }
  return config;
};

export const AppMenuBar: React.FC<AppMenuBarProps> = ({ config, isInsideTabBar = false }) => {
  const { euiTheme } = useEuiTheme();
  const menuConfig = getConfig(config);
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);

  const renderButton = (button: MenuBarButton) => {
    if (button.isSplitButton) {
      // Split button for Save
      return (
        <EuiSplitButton
          key={button.id}
          size="s"
          color="text"
          fill={false}
        >
          <EuiSplitButton.ActionPrimary
            iconType={button.iconType}
            onClick={button.onClick}
            disabled={button.disabled}
          >
            {button.label}
          </EuiSplitButton.ActionPrimary>
          <EuiSplitButton.ActionSecondary
            iconType="arrowDown"
            aria-label="Save options"
            popoverProps={{
              isOpen: isSavePopoverOpen,
              closePopover: () => setIsSavePopoverOpen(false),
              children: (
                <div style={{ padding: euiTheme.size.xs }}>
                  {button.splitButtonPopoverItems?.map((item) => (
                    <EuiButtonEmpty
                      key={item.id}
                      size="s"
                      onClick={() => {
                        item.onClick();
                        setIsSavePopoverOpen(false);
                      }}
                      style={{ width: "100%", justifyContent: "flex-start" }}
                    >
                      {item.label}
                    </EuiButtonEmpty>
                  ))}
                </div>
              ),
            }}
          />
        </EuiSplitButton>
      );
    }

    if (button.isPrimary) {
      // Primary button with border/background
      return (
        <EuiButton
          key={button.id}
          {...(button.iconType && { iconType: button.iconType })}
          onClick={button.onClick}
          size="s"
          color={button.color || "primary"}
          {...(button.disabled !== undefined && { disabled: button.disabled })}
        >
          {button.label}
        </EuiButton>
      );
    }

    if (!button.label) {
      // Icon-only button (like ellipsis or dropdown)
      if (!button.iconType) {
        return null;
      }
      return (
        <EuiButtonIcon
          key={button.id}
          iconType={button.iconType}
          onClick={button.disabled ? () => {} : button.onClick}
          aria-label={button.id}
          size="s"
          color="text"
          style={{
            opacity: button.disabled ? 0.5 : 1,
            cursor: button.disabled ? "not-allowed" : "pointer",
          }}
        />
      );
    }

    // Regular text button with icon
    return (
      <EuiButtonEmpty
        key={button.id}
        {...(button.iconType && { iconType: button.iconType })}
        onClick={button.onClick}
        size="s"
        color="text"
        {...(button.disabled !== undefined && { disabled: button.disabled })}
      >
        {button.label}
      </EuiButtonEmpty>
    );
  };

  return (
    <div
      style={{
        padding: `${euiTheme.size.s} 0`,
        paddingRight: isInsideTabBar ? 0 : euiTheme.size.s, // 8px right padding when not inside TabBar
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: euiTheme.size.xs,
      }}
    >
      {/* Action buttons */}
      <EuiFlexGroup gutterSize="xs" alignItems="center" justifyContent="flexEnd">
        {menuConfig.buttons.map((button) => (
          <EuiFlexItem grow={false} key={button.id}>
            {renderButton(button)}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
