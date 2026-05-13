import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSwitch,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiMarkdownEditor,
  EuiSpacer,
} from "@elastic/eui";
import React, { useState, useEffect } from "react";
import { GridItem } from "./DashboardGrid";

interface PanelSettingsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  item: GridItem | null;
  onSave: (itemId: string, title: string, showTitle: boolean, markdownContent?: string, showBorder?: boolean) => void;
}

export const PanelSettingsFlyout: React.FC<PanelSettingsFlyoutProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(true);
  const [markdownContent, setMarkdownContent] = useState("");
  const [showBorder, setShowBorder] = useState(true);

  const isMarkdownPanel = item?.panelType === "markdown";
  const isControlPanel = item?.panelType === "control";

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setShowTitle(item.showTitle !== undefined ? item.showTitle : true);
      setMarkdownContent(item.markdownContent || "");
      setShowBorder(item.showBorder !== undefined ? item.showBorder : true);
    }
  }, [item]);

  const handleSave = () => {
    if (item) {
      onSave(
        item.i, 
        title, 
        showTitle, 
        isMarkdownPanel ? markdownContent : undefined,
        isControlPanel ? showBorder : undefined
      );
      onClose();
    }
  };

  const handleCancel = () => {
    if (item) {
      setTitle(item.title || "");
      setShowTitle(item.showTitle !== undefined ? item.showTitle : true);
      setMarkdownContent(item.markdownContent || "");
      setShowBorder(item.showBorder !== undefined ? item.showBorder : true);
    }
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <EuiFlyout onClose={onClose} size="s" ownFocus>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>Panel settings</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiForm>
          <EuiFormRow label="Title" fullWidth>
            <EuiFieldText
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter panel title"
            />
          </EuiFormRow>

          <EuiFormRow label="Show title" fullWidth>
            <EuiSwitch
              label="Display title on panel"
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
            />
          </EuiFormRow>

          {isMarkdownPanel && (
            <>
              <EuiSpacer size="m" />
              <EuiFormRow label="Markdown content" fullWidth>
                <EuiMarkdownEditor
                  value={markdownContent}
                  onChange={setMarkdownContent}
                  aria-labelledby="markdown-editor"
                  height={300}
                />
              </EuiFormRow>
            </>
          )}

          {isControlPanel && (
            <>
              <EuiSpacer size="m" />
              <EuiFormRow label="Show border" fullWidth>
                <EuiSwitch
                  label="Display border around panel"
                  checked={showBorder}
                  onChange={(e) => setShowBorder(e.target.checked)}
                />
              </EuiFormRow>
            </>
          )}
        </EuiForm>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={handleCancel}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={handleSave} fill>
              Save
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
