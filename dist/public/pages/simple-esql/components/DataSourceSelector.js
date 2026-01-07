"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceSelector = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const dataSourceGenerator_1 = require("../../../utils/dataSourceGenerator");
const DataSourceSelector = ({ selectedIndex, onDataSourceChange, width = 176, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const [isDataSourcePopoverOpen, setIsDataSourcePopoverOpen] = (0, react_1.useState)(false);
    const [dataSourceSearchTerm, setDataSourceSearchTerm] = (0, react_1.useState)("");
    const [selectedTypeFilters, setSelectedTypeFilters] = (0, react_1.useState)([]);
    const [showTypeFilters, setShowTypeFilters] = (0, react_1.useState)(false);
    // Create label mappings using utility functions
    const labelToIndexMapping = (0, dataSourceGenerator_1.createLabelToIndexMapping)();
    const indexToLabelMapping = (0, dataSourceGenerator_1.createIndexToLabelMapping)(labelToIndexMapping);
    // Filtered options based on search term and type filters
    const filteredIndexOptions = (0, dataSourceGenerator_1.filterDataSources)(selectedTypeFilters, dataSourceSearchTerm);
    const handleDataSourceSelection = (newIndex) => {
        onDataSourceChange(newIndex);
        setIsDataSourcePopoverOpen(false);
        setDataSourceSearchTerm("");
        setShowTypeFilters(false);
    };
    return ((0, jsx_runtime_1.jsx)(eui_1.EuiPopover, { button: (0, jsx_runtime_1.jsxs)("div", { onClick: () => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen), style: {
                border: `1px solid ${euiTheme.colors.borderBasePlain}`,
                borderRadius: euiTheme.border.radius.medium,
                backgroundColor: euiTheme.colors.emptyShade,
                width: `${width}px`,
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                color: euiTheme.colors.text,
            }, children: [(0, jsx_runtime_1.jsx)("span", { children: indexToLabelMapping[selectedIndex] || selectedIndex }), (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s" })] }), isOpen: isDataSourcePopoverOpen, closePopover: () => {
            setIsDataSourcePopoverOpen(false);
            setDataSourceSearchTerm("");
            setShowTypeFilters(false);
        }, panelPaddingSize: "none", anchorPosition: "downLeft", children: (0, jsx_runtime_1.jsxs)("div", { style: { width: 400 }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                        padding: "8px",
                        borderBottom: "1px solid #D3DAE6",
                    }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldSearch, { placeholder: "Search data sources", value: dataSourceSearchTerm, onChange: (e) => setDataSourceSearchTerm(e.target.value), compressed: true, fullWidth: true, append: (0, jsx_runtime_1.jsxs)(eui_1.EuiButtonEmpty, { size: "s", color: "text", onClick: () => setShowTypeFilters(!showTypeFilters), style: {
                                width: "56px",
                                minWidth: "56px",
                                paddingInline: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }, css: {
                                "& .euiButtonEmpty__content": {
                                    paddingBottom: "2px",
                                },
                            }, "aria-label": "Filter by type", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "filter", size: "m" }), (0, jsx_runtime_1.jsx)(eui_1.EuiNotificationBadge, { style: { marginLeft: "8px" }, color: selectedTypeFilters.length > 0 ? "accent" : "subdued", size: "s", children: selectedTypeFilters.length })] }) }) }), showTypeFilters && ((0, jsx_runtime_1.jsxs)("div", { style: {
                        padding: "8px",
                        borderBottom: "1px solid #D3DAE6",
                        backgroundColor: "#F7F8FC",
                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                            }, children: "Filter by type" }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexGroup, { gutterSize: "s", direction: "column", children: dataSourceGenerator_1.dataSourceTypes.map((type) => ((0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiCheckbox, { id: `type-filter-${type}`, label: type, checked: selectedTypeFilters.includes(type), onChange: (e) => {
                                        if (e.target.checked) {
                                            setSelectedTypeFilters([...selectedTypeFilters, type]);
                                        }
                                        else {
                                            setSelectedTypeFilters(selectedTypeFilters.filter((t) => t !== type));
                                        }
                                    } }) }, type))) }), (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", justifyContent: "spaceBetween", style: { marginTop: "8px" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "xs", onClick: () => setSelectedTypeFilters([]), disabled: selectedTypeFilters.length === 0, children: "Clear all" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "xs", onClick: () => setShowTypeFilters(false), children: "Done" }) })] })] })), (0, jsx_runtime_1.jsx)("div", { style: { maxHeight: "300px", overflowY: "auto" }, children: filteredIndexOptions.length > 0 ? (filteredIndexOptions.map((option) => ((0, jsx_runtime_1.jsx)("div", { style: {
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${euiTheme.border.color}`,
                            backgroundColor: labelToIndexMapping[option.label] === selectedIndex
                                ? euiTheme.colors.backgroundBaseHighlighted
                                : "transparent",
                        }, onClick: () => handleDataSourceSelection(labelToIndexMapping[option.label] || option.label), onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor =
                                euiTheme.colors.backgroundBaseHighlighted;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor =
                                labelToIndexMapping[option.label] === selectedIndex
                                    ? euiTheme.colors.backgroundBaseHighlighted
                                    : "transparent";
                        }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { justifyContent: "spaceBetween", alignItems: "center", gutterSize: "s", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: option.label }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiBadge, { color: option.type === "Integration"
                                            ? "primary"
                                            : option.type === "Stream"
                                                ? "success"
                                                : "default", style: { fontSize: "11px" }, children: option.type }) })] }) }, option.label)))) : ((0, jsx_runtime_1.jsx)("div", { style: {
                            padding: "16px",
                            textAlign: "center",
                            color: "#69707D",
                        }, children: "No data views found" })) })] }) }));
};
exports.DataSourceSelector = DataSourceSelector;
//# sourceMappingURL=DataSourceSelector.js.map