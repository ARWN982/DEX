"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "l" }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexGroup, { justifyContent: "center", children: (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPagination, { "aria-label": "Metrics pagination", pageCount: totalPages, activePage: currentPage, onPageClick: onPageChange }) }) })] }));
};
exports.Pagination = Pagination;
//# sourceMappingURL=Pagination.js.map