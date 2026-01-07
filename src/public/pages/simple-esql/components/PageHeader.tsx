import React from "react";
import {
  EuiButton,
  EuiButtonEmpty,
  // EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
} from "@elastic/eui";

interface PageHeaderProps {
  onSave?: () => void;
  onShare?: () => void;
  onInspect?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onSave,
  onShare,
  onInspect,
}) => {
  return (
    <>
      {/* Page header with actions */}
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        justifyContent="flexEnd"
        style={{ padding: "8px" }}
      >
        {/* <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="inspect"
            aria-label="Inspect"
            color="text"
            onClick={onInspect}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="share"
            aria-label="Share"
            color="text"
            onClick={onShare}
          />
        </EuiFlexItem> */}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty color="text" size="s" onClick={onSave}>
            Share
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty color="text" size="s" onClick={onSave}>
            Export
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty color="text" size="s" onClick={onSave}>
            Open
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton color="text" size="s" onClick={onSave}>
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule margin="none" />
    </>
  );
};
