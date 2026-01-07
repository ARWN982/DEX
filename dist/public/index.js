"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_query_1 = require("@tanstack/react-query");
const client_1 = __importDefault(require("react-dom/client"));
const react_router_dom_1 = require("react-router-dom");
const use_query_params_1 = require("use-query-params");
const react_router_6_1 = require("use-query-params/adapters/react-router-6");
const App_1 = __importDefault(require("./App"));
const queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
const root = client_1.default.createRoot(document.getElementById('root'));
root.render((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsx)(use_query_params_1.QueryParamProvider, { adapter: react_router_6_1.ReactRouter6Adapter, children: (0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: (0, jsx_runtime_1.jsx)(App_1.default, {}) }) }) }));
//# sourceMappingURL=index.js.map