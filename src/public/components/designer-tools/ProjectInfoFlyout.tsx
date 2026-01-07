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
  projectName: string;
  designer: string;
  pm: string;
  briefDescription: string;
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
    projectName: '',
    designer: '',
    pm: '',
    briefDescription: '',
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
          <h2>Edit Project Info</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiForm>
          <EuiFormRow label="Project Name:" fullWidth>
            <EuiFieldText
              fullWidth
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="Enter project name"
            />
          </EuiFormRow>

          <EuiFormRow label="Designer:" fullWidth>
            <EuiFieldText
              fullWidth
              value={formData.designer}
              onChange={(e) => handleInputChange('designer', e.target.value)}
              placeholder="Enter designer name"
            />
          </EuiFormRow>

          <EuiFormRow label="PM:" fullWidth>
            <EuiFieldText
              fullWidth
              value={formData.pm}
              onChange={(e) => handleInputChange('pm', e.target.value)}
              placeholder="Enter PM name"
            />
          </EuiFormRow>

          <EuiFormRow label="Brief description" fullWidth>
            <EuiTextArea
              fullWidth
              value={formData.briefDescription}
              onChange={(e) => handleInputChange('briefDescription', e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </EuiFormRow>

          <EuiFormRow label="PRD link:" fullWidth>
            <EuiFieldText
              fullWidth
              value={formData.prdLink}
              onChange={(e) => handleInputChange('prdLink', e.target.value)}
              placeholder="www.url.com"
            />
          </EuiFormRow>

          <EuiFormRow label="Github issue link:" fullWidth>
            <EuiFieldText
              fullWidth
              value={formData.githubIssueLink}
              onChange={(e) => handleInputChange('githubIssueLink', e.target.value)}
              placeholder="www.url2.com"
            />
          </EuiFormRow>

          <EuiFormRow label="Breadcrumb:" fullWidth>
            <EuiFieldText
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

