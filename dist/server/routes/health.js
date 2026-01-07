"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
exports.default = router;
//# sourceMappingURL=health.js.map