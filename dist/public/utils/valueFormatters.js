"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueFormatter = void 0;
const numeral_1 = __importDefault(require("numeral"));
const getSmartNumberFormat = (value) => {
    // Handle zero
    if (value === 0)
        return '0';
    const absValue = Math.abs(value);
    // For very small numbers (< 0.001), use scientific notation
    if (absValue < 0.001) {
        return value.toExponential(2);
    }
    // For small numbers (< 1), show up to 6 significant digits
    if (absValue < 1) {
        return value.toPrecision(6);
    }
    // For integers or numbers with no meaningful decimal part
    if (Number.isInteger(value) || absValue % 1 < 0.01) {
        return (0, numeral_1.default)(value).format('0,0');
    }
    // For numbers with 1-2 decimal places
    if (absValue < 100) {
        return (0, numeral_1.default)(value).format('0,0.00');
    }
    // For larger numbers, show 1 decimal place
    return (0, numeral_1.default)(value).format('0,0.0');
};
const getValueFormatter = (unit, metricName) => {
    if (unit === 'byte' || unit === 'By') {
        return (value) => (0, numeral_1.default)(value).format('0.0b');
    }
    else if (unit === 'percent' || unit === '1') {
        return (value) => (0, numeral_1.default)(value).format('0.0%');
    }
    else if (metricName?.endsWith('pct')) {
        // Fallback for existing naming convention
        return (value) => (0, numeral_1.default)(value).format('0.0%');
    }
    else if (metricName?.endsWith('bytes')) {
        // Fallback for existing naming convention
        return (value) => (0, numeral_1.default)(value).format('0b');
    }
    else {
        return (value) => getSmartNumberFormat(value);
    }
};
exports.getValueFormatter = getValueFormatter;
//# sourceMappingURL=valueFormatters.js.map