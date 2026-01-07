"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
// Component to handle dynamic field row alignment based on text wrapping
const FieldRow = ({ fieldName, fieldType, getFieldTypeIcon, children }) => {
    const textRef = (0, react_1.useRef)(null);
    const [isMultiLine, setIsMultiLine] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const checkTextWrapping = () => {
            if (textRef.current) {
                const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
                const height = textRef.current.offsetHeight;
                setIsMultiLine(height > lineHeight * 1.2); // Allow for slight rounding
            }
        };
        checkTextWrapping();
        window.addEventListener("resize", checkTextWrapping);
        return () => window.removeEventListener("resize", checkTextWrapping);
    }, [fieldName]);
    const iconType = fieldType ? getFieldTypeIcon(fieldType) : "tokenString";
    return ((0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: isMultiLine ? "flexStart" : "center", gutterSize: "xs", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, style: isMultiLine ? { paddingTop: "2px" } : {}, children: (0, jsx_runtime_1.jsx)(eui_1.EuiToken, { iconType: iconType, size: "s" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsxs)("div", { className: "field-list-item", style: {
                        display: "flex",
                        alignItems: isMultiLine ? "flex-start" : "center",
                        position: "relative",
                        width: "100%",
                        minHeight: "24px",
                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { flex: 1, marginRight: "8px", minWidth: 0 }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "xs", children: (0, jsx_runtime_1.jsx)("span", { ref: textRef, style: {
                                        wordWrap: "break-word",
                                        wordBreak: "break-word",
                                        lineHeight: "1.2",
                                        display: "block",
                                    }, children: fieldName }) }) }), children] }) })] }));
};
const FieldList = ({ availableFields, selectedFields, fieldTypes, onFieldToggle, getFieldTypeIcon, filteredAvailableFieldsCount, filteredSelectedFieldsCount, }) => {
    const [fieldSearchTerm, setFieldSearchTerm] = (0, react_1.useState)("");
    // Filter fields based on search term
    const filteredSelectedFields = (0, react_1.useMemo)(() => {
        const selected = Object.keys(selectedFields).filter((field) => selectedFields[field]);
        return fieldSearchTerm
            ? selected.filter((field) => field.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
            : selected;
    }, [selectedFields, fieldSearchTerm]);
    const filteredAvailableFields = (0, react_1.useMemo)(() => {
        const unselected = availableFields.filter((field) => !selectedFields[field]);
        return fieldSearchTerm
            ? unselected.filter((field) => field.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
            : unselected;
    }, [availableFields, selectedFields, fieldSearchTerm]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { height: "100%", display: "flex", flexDirection: "column", paddingBottom: 0 }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    position: "sticky",
                    top: 0,
                    backgroundColor: "inherit",
                    zIndex: 10,
                    paddingBottom: "8px",
                }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "xs", alignItems: "center", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "transitionLeftOut", "aria-label": "Field options", color: "text", display: "base", size: "s" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldSearch, { placeholder: "Search field names", compressed: true, fullWidth: true, value: fieldSearchTerm, onChange: (e) => setFieldSearchTerm(e.target.value) }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, overflowY: "auto", paddingTop: "4px" }, children: [(0, jsx_runtime_1.jsxs)(eui_1.EuiAccordion, { id: "selectedFields", buttonContent: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", children: (0, jsx_runtime_1.jsx)("strong", { children: "Selected fields" }) }), extraAction: (0, jsx_runtime_1.jsx)(eui_1.EuiNotificationBadge, { size: "s", color: "subdued", children: filteredSelectedFields.length }), initialIsOpen: true, paddingSize: "none", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "s" }), (0, jsx_runtime_1.jsx)("div", { style: { maxHeight: "200px", overflowY: "auto" }, children: filteredSelectedFields.map((fieldName) => {
                                    return ((0, jsx_runtime_1.jsx)("div", { style: {
                                            marginBottom: "4px",
                                            minHeight: "24px",
                                        }, className: "field-list-item-container", onMouseEnter: (e) => {
                                            const removeButton = e.currentTarget.querySelector(".field-remove-button");
                                            if (removeButton) {
                                                removeButton.style.opacity = "1";
                                            }
                                        }, onMouseLeave: (e) => {
                                            const removeButton = e.currentTarget.querySelector(".field-remove-button");
                                            if (removeButton) {
                                                removeButton.style.opacity = "0";
                                            }
                                        }, children: (0, jsx_runtime_1.jsx)(FieldRow, { fieldName: fieldName, fieldType: fieldTypes[fieldName], getFieldTypeIcon: getFieldTypeIcon, children: (0, jsx_runtime_1.jsx)("div", { className: "field-remove-button", style: {
                                                    opacity: 0,
                                                    transition: "opacity 0.2s",
                                                    flexShrink: 0,
                                                    marginTop: "1px",
                                                }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiToolTip, { content: "Remove field", children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { size: "xs", iconType: "cross", color: "danger", onClick: () => onFieldToggle(fieldName), "aria-label": `Remove ${fieldName} field` }) }) }) }) }, `selected-${fieldName}`));
                                }) })] }), (0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "m" }), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, display: "flex", flexDirection: "column" }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiAccordion, { id: "availableFields", buttonContent: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", children: (0, jsx_runtime_1.jsx)("strong", { children: "Available fields" }) }), extraAction: (0, jsx_runtime_1.jsx)(eui_1.EuiNotificationBadge, { size: "s", color: "subdued", children: filteredAvailableFields.length }), initialIsOpen: true, paddingSize: "none", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "s" }), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, overflowY: "auto" }, children: filteredAvailableFields.map((fieldName) => {
                                        return ((0, jsx_runtime_1.jsx)("div", { style: {
                                                marginBottom: "4px",
                                                minHeight: "24px",
                                            }, className: "field-list-item-container", onMouseEnter: (e) => {
                                                const addButton = e.currentTarget.querySelector(".field-add-button");
                                                if (addButton) {
                                                    addButton.style.opacity = "1";
                                                }
                                            }, onMouseLeave: (e) => {
                                                const addButton = e.currentTarget.querySelector(".field-add-button");
                                                if (addButton) {
                                                    addButton.style.opacity = "0";
                                                }
                                            }, children: (0, jsx_runtime_1.jsx)("div", { style: { cursor: "pointer" }, onClick: () => onFieldToggle(fieldName), children: (0, jsx_runtime_1.jsx)(FieldRow, { fieldName: fieldName, fieldType: fieldTypes[fieldName], getFieldTypeIcon: getFieldTypeIcon, children: (0, jsx_runtime_1.jsx)("div", { className: "field-add-button", style: {
                                                            opacity: 0,
                                                            transition: "opacity 0.2s",
                                                            flexShrink: 0,
                                                            marginTop: "1px",
                                                        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiToolTip, { content: "Add field to table", children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { size: "xs", iconType: "plusInCircle", color: "primary", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    onFieldToggle(fieldName);
                                                                }, "aria-label": `Add ${fieldName} field` }) }) }) }) }) }, `available-${fieldName}`));
                                    }) })] }) })] })] }));
};
exports.FieldList = FieldList;
//# sourceMappingURL=FieldList.js.map