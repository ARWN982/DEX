"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStoriesTable = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const phosphor_react_1 = require("phosphor-react");
const useAppStore_1 = require("../../store/useAppStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const JobStoriesTable = ({ stories, onStoriesChange, }) => {
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const designColors = (0, designToolsColors_1.getDesignUIColors)(colorMode);
    // Use app theme colors instead of reverse colors
    const colors = {
        background: designColors.primary,
        surface: designColors.secondary,
        border: designColors.border,
        text: designColors.textPrimary,
        textSecondary: designColors.textSecondary,
        // Table-specific colors using the app theme
        tableBackground: designColors.primary,
        tableBorder: designColors.border,
        tableText: designColors.textPrimary,
        tableTextSecondary: designColors.textSecondary,
        tableHeader: designColors.secondary,
    };
    const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const updateStory = (id, field, value) => {
        const updatedStories = stories.map((story) => story.id === id ? { ...story, [field]: value } : story);
        onStoriesChange(updatedStories);
    };
    const removeStory = (id) => {
        onStoriesChange(stories.filter((story) => story.id !== id));
    };
    // Ensure we always have at least one empty row (commented out to debug API loading)
    // React.useEffect(() => {
    //   if (stories.length === 0) {
    //     // Start with one empty row only if we haven't loaded data from API yet
    //     const newStory: JobStory = {
    //       id: generateId(),
    //       jobStory: "",
    //       acceptanceCriteria: "",
    //       implementation: "Pending",
    //     };
    //     onStoriesChange([newStory]);
    //   } else {
    //     // Ensure the last row is always empty, but only add if the last row has content
    //     const lastStory = stories[stories.length - 1];
    //     if (lastStory && lastStory.jobStory.trim() !== "" && lastStory.acceptanceCriteria.trim() !== "") {
    //       const newStory: JobStory = {
    //         id: generateId(),
    //         jobStory: "",
    //         acceptanceCriteria: "",
    //         implementation: "Pending",
    //       };
    //       onStoriesChange([...stories, newStory]);
    //     }
    //   }
    // }, [stories, onStoriesChange]);
    // Define columns
    const columns = [
        {
            field: "jobStory",
            name: "Job Stories",
            render: (value, story) => {
                return ((0, jsx_runtime_1.jsx)("div", { contentEditable: true, suppressContentEditableWarning: true, onBlur: (e) => {
                        const newValue = e.currentTarget.textContent || "";
                        if (newValue !== value) {
                            updateStory(story.id, "jobStory", newValue);
                        }
                    }, onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }, style: {
                        minHeight: "60px",
                        padding: "8px 0",
                        color: colors.tableText,
                        fontSize: "14px",
                        lineHeight: "1.5",
                        outline: "none",
                        border: "none",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: "left",
                    }, "data-placeholder": value ? "" : "Enter job story", children: value }));
            },
            width: "40%",
        },
        {
            field: "acceptanceCriteria",
            name: "Acceptance Criteria",
            render: (value, story) => {
                return ((0, jsx_runtime_1.jsx)("div", { contentEditable: true, suppressContentEditableWarning: true, onBlur: (e) => {
                        const newValue = e.currentTarget.textContent || "";
                        if (newValue !== value) {
                            updateStory(story.id, "acceptanceCriteria", newValue);
                        }
                    }, onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }, style: {
                        minHeight: "60px",
                        padding: "8px 0",
                        color: colors.tableText,
                        fontSize: "14px",
                        lineHeight: "1.5",
                        outline: "none",
                        border: "none",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: "left",
                    }, "data-placeholder": value ? "" : "Enter acceptance criteria", children: value }));
            },
            width: "40%",
        },
        {
            field: "implementation",
            name: "Covered?",
            render: (value, story) => {
                const options = [
                    {
                        value: "Not yet",
                        inputDisplay: "Not yet",
                    },
                    {
                        value: "Yes",
                        inputDisplay: "Yes",
                    },
                ];
                return ((0, jsx_runtime_1.jsx)(eui_1.EuiSuperSelect, { options: options, valueOfSelected: value, onChange: (newValue) => updateStory(story.id, "implementation", newValue), hasDividers: false, style: {
                        backgroundColor: "transparent",
                        border: "none",
                    } }));
            },
            width: "20%",
        },
        {
            name: "Actions",
            render: (story) => ((0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: phosphor_react_1.Trash, "aria-label": "Delete story", onClick: () => removeStory(story.id), style: {
                    color: designColors.error,
                } })),
            width: "60px",
        },
    ];
    return ((0, jsx_runtime_1.jsx)("div", { style: { padding: "0" }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                backgroundColor: colors.tableBackground,
                borderRadius: "8px",
                overflow: "hidden",
                border: `1px solid ${colors.tableBorder}`,
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiBasicTable, { items: stories, columns: columns, tableLayout: "auto", className: "job-stories-table", css: {
                    "& .euiTable": {
                        backgroundColor: colors.tableBackground,
                        border: "none !important",
                    },
                    "& .euiTableHeaderCell": {
                        backgroundColor: colors.tableHeader,
                        color: colors.tableTextSecondary,
                        borderBottom: `1px solid ${colors.tableBorder}`,
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        textAlign: "left",
                    },
                    "& .euiTableRow": {
                        backgroundColor: colors.tableBackground,
                        border: "none !important",
                    },
                    "& .euiTableRowCell": {
                        border: "none !important",
                        borderBottom: `1px solid ${colors.tableBorder} !important`,
                        padding: "8px",
                        verticalAlign: "top !important",
                    },
                    "& .euiTableRow:last-child .euiTableRowCell": {
                        borderBottom: "none !important",
                    },
                    "& .euiTextArea": {
                        backgroundColor: "transparent !important",
                        border: "none !important",
                        color: `${colors.tableText} !important`,
                        fontSize: "14px !important",
                        fontFamily: "inherit !important",
                        lineHeight: "1.5 !important",
                        outline: "none !important",
                        boxShadow: "none !important",
                        padding: "0 !important",
                        resize: "vertical",
                    },
                    "& .euiTextArea::placeholder": {
                        color: `${colors.tableTextSecondary} !important`,
                        opacity: "0.5 !important",
                    },
                    "& .euiSuperSelect": {
                        backgroundColor: "transparent !important",
                    },
                    "& .euiSuperSelectControl": {
                        border: `1px solid ${colors.tableBorder} !important`,
                        backgroundColor: "transparent !important",
                        boxShadow: "none !important",
                        color: `${colors.tableText} !important`,
                        borderRadius: "6px !important",
                    },
                    "& .euiSuperSelectControl .euiText": {
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiSuperSelectControl .euiIcon": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiSuperSelectControl svg": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiSuperSelectControl [data-euiicon-type]": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiSuperSelectControl::after": {
                        borderColor: `${colors.tableText} transparent transparent transparent !important`,
                    },
                    '& [data-euiicon-type="arrowDown"]': {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    '& svg[data-euiicon-type="arrowDown"]': {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiFormControlLayoutIcons": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiFormControlLayoutIcons svg": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& .euiFormControlLayoutIcons .euiIcon": {
                        fill: `${colors.tableText} !important`,
                        color: `${colors.tableText} !important`,
                    },
                    "& [contenteditable]:empty::before": {
                        content: "attr(data-placeholder)",
                        color: `${colors.tableTextSecondary}`,
                        fontStyle: "italic",
                        pointerEvents: "none",
                    },
                    "& [contenteditable]:focus": {
                        outline: "none",
                    },
                } }) }) }));
};
exports.JobStoriesTable = JobStoriesTable;
//# sourceMappingURL=JobStoriesTable.js.map