import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import React, { useState, useEffect } from 'react';

export interface ProjectMetadata {
  slug: string;
  displayName: string;
  designer: string;
  pm: string;
  bodyMarkdown: string;
  prdLink: string;
  githubIssueLink: string;
  breadcrumb: string;
  thumbnail?: {
    filename: string;
    version: string;
    createdAt: string;
    url: string;
  };
}

interface ProjectInfoFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectMetadata: ProjectMetadata | null;
  onSave: (metadata: ProjectMetadata) => void;
}

export const ProjectInfoFlyout: React.FC<ProjectInfoFlyoutProps> = ({
  isOpen,
  onClose,
  projectPath,
  projectMetadata,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProjectMetadata>({
    slug: '',
    displayName: '',
    designer: '',
    pm: '',
    bodyMarkdown: '',
    prdLink: '',
    githubIssueLink: '',
    breadcrumb: '',
  });

  useEffect(() => {
    if (projectMetadata) {
      setFormData(projectMetadata);
    }
  }, [projectMetadata]);

  const handleInputChange = (field: keyof ProjectMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    if (projectMetadata) {
      setFormData(projectMetadata);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <EuiFlyout onClose={onClose} size="m" ownFocus>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>Edit project info</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiForm component="form">
          <EuiFormRow
            label="Display name"
            helpText="Shown on project cards and headers."
            fullWidth
          >
            <EuiFieldText
              compressed
              fullWidth
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter display name"
            />
          </EuiFormRow>

          <EuiFormRow
            label="URL slug"
            helpText="Used in the project URL. Cannot be changed."
            fullWidth
          >
            <EuiFieldText
              compressed
              fullWidth
              value={formData.slug}
              readOnly
              disabled
            />
          </EuiFormRow>

          <EuiFormRow label="Designer" fullWidth>
            <EuiFieldText
              compressed
              fullWidth
              value={formData.designer}
              onChange={(e) => handleInputChange('designer', e.target.value)}
              placeholder="Enter designer name"
            />
          </EuiFormRow>

          <EuiFormRow label="PM" fullWidth>
            <EuiFieldText
              compressed
              fullWidth
              value={formData.pm}
              onChange={(e) => handleInputChange('pm', e.target.value)}
              placeholder="Enter PM name"
            />
          </EuiFormRow>

          <EuiFormRow label="Description (Markdown supported)" fullWidth>
            <EuiTextArea
              compressed
              fullWidth
              value={formData.bodyMarkdown}
              onChange={(e) => handleInputChange('bodyMarkdown', e.target.value)}
              placeholder="Describe this project — Markdown is supported"
              rows={5}
            />
          </EuiFormRow>

          <EuiFormRow label="PRD link" fullWidth>
            <EuiFieldText
              compressed
              fullWidth
              value={formData.prdLink}
              onChange={(e) => handleInputChange('prdLink', e.target.value)}
              placeholder="www.url.com"
            />
          </EuiFormRow>

          <EuiFormRow label="GitHub issue link" fullWidth>
            <EuiFieldText
              compressed
              fullWidth
              value={formData.githubIssueLink}
              onChange={(e) => handleInputChange('githubIssueLink', e.target.value)}
              placeholder="www.url2.com"
            />
          </EuiFormRow>

          <EuiFormRow label="Breadcrumb" fullWidth>
            <EuiFieldText
              compressed
              fullWidth
              value={formData.breadcrumb}
              onChange={(e) => handleInputChange('breadcrumb', e.target.value)}
              placeholder="Discover"
            />
          </EuiFormRow>
        </EuiForm>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={handleCancel}>
              Cancel
            </EuiButtonEmpty>
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

