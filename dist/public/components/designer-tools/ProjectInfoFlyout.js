"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectInfoFlyout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const ProjectInfoFlyout = ({ isOpen, onClose, projectPath, projectMetadata, onSave, }) => {
    const [formData, setFormData] = (0, react_1.useState)({
        projectName: '',
        designer: '',
        pm: '',
        briefDescription: '',
        prdLink: '',
        githubIssueLink: '',
        breadcrumb: '',
    });
    (0, react_1.useEffect)(() => {
        if (projectMetadata) {
            setFormData(projectMetadata);
        }
    }, [projectMetadata]);
    const handleInputChange = (field, value) => {
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
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsxs)(eui_1.EuiFlyout, { onClose: onClose, size: "m", ownFocus: true, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutHeader, { hasBorder: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiTitle, { size: "m", children: (0, jsx_runtime_1.jsx)("h2", { children: "Edit Project Info" }) }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutBody, { children: (0, jsx_runtime_1.jsxs)(eui_1.EuiForm, { children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "Project Name:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.projectName, onChange: (e) => handleInputChange('projectName', e.target.value), placeholder: "Enter project name" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "Designer:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.designer, onChange: (e) => handleInputChange('designer', e.target.value), placeholder: "Enter designer name" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "PM:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.pm, onChange: (e) => handleInputChange('pm', e.target.value), placeholder: "Enter PM name" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "Brief description", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiTextArea, { fullWidth: true, value: formData.briefDescription, onChange: (e) => handleInputChange('briefDescription', e.target.value), placeholder: "Enter project description", rows: 3 }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "PRD link:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.prdLink, onChange: (e) => handleInputChange('prdLink', e.target.value), placeholder: "www.url.com" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "Github issue link:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.githubIssueLink, onChange: (e) => handleInputChange('githubIssueLink', e.target.value), placeholder: "www.url2.com" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFormRow, { label: "Breadcrumb:", fullWidth: true, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { fullWidth: true, value: formData.breadcrumb, onChange: (e) => handleInputChange('breadcrumb', e.target.value), placeholder: "Discover" }) })] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutFooter, { children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { justifyContent: "spaceBetween", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { onClick: handleCancel, children: "Cancel" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { onClick: handleSave, fill: true, children: "Save" }) })] }) })] }));
};
exports.ProjectInfoFlyout = ProjectInfoFlyout;
//# sourceMappingURL=ProjectInfoFlyout.js.map