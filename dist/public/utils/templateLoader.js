"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateLoader = void 0;
const react_1 = __importDefault(require("react"));
/**
 * Simple template loader for loading components from the templates directory
 * Unlike versioned components, templates are simpler and don't have versions
 */
const TemplateLoader = ({ templateName, ...props }) => {
    const [Component, setComponent] = react_1.default.useState(null);
    const [loading, setLoading] = react_1.default.useState(true);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        let mounted = true;
        const loadTemplate = async () => {
            setLoading(true);
            setError(null);
            try {
                // Since dynamic imports might have issues, let's use a more explicit approach
                let module;
                switch (templateName) {
                    case 'discover':
                        module = await Promise.resolve().then(() => __importStar(require('../templates/discover')));
                        break;
                    default:
                        throw new Error(`Unknown template: ${templateName}`);
                }
                if (mounted) {
                    if (module.default) {
                        setComponent(() => module.default);
                    }
                    else {
                        // Check for named exports
                        const namedExports = Object.keys(module).filter(key => key !== 'default');
                        if (namedExports.length > 0) {
                            // Use the first named export that looks like a component
                            const ComponentExport = module[namedExports[0]];
                            if (typeof ComponentExport === 'function') {
                                setComponent(() => ComponentExport);
                            }
                            else {
                                setError(`No valid component found in template: ${templateName}`);
                            }
                        }
                        else {
                            setError(`No exports found in template: ${templateName}`);
                        }
                    }
                }
            }
            catch (err) {
                if (mounted) {
                    console.error('Template loading error:', err);
                    setError(`Failed to load template ${templateName}: ${err}`);
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        loadTemplate();
        return () => {
            mounted = false;
        };
    }, [templateName]);
    if (loading) {
        return react_1.default.createElement("div", {}, `Loading template ${templateName}...`);
    }
    if (error || !Component) {
        console.error("TemplateLoader error:", error);
        return react_1.default.createElement("div", {
            style: {
                padding: "40px",
                textAlign: "center",
                color: "#666",
                fontSize: "16px",
                lineHeight: "1.6",
            },
        }, `Template not found: ${templateName}. Check that src/public/templates/${templateName}/index.tsx exists.`);
    }
    return react_1.default.createElement(Component, props);
};
exports.TemplateLoader = TemplateLoader;
//# sourceMappingURL=templateLoader.js.map