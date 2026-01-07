"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantFlyout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const AssistantFlyout = ({ isOpen, onClose, initialMessage, autoSubmit, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const [message, setMessage] = (0, react_1.useState)(initialMessage || "");
    const [conversationStarted, setConversationStarted] = (0, react_1.useState)(false);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [assistantResponse, setAssistantResponse] = (0, react_1.useState)("");
    // Update message when initialMessage changes
    (0, react_1.useEffect)(() => {
        if (initialMessage) {
            setMessage(initialMessage);
        }
    }, [initialMessage]);
    // Auto-submit when flyout opens with autoSubmit flag
    (0, react_1.useEffect)(() => {
        if (isOpen && autoSubmit && initialMessage && !conversationStarted) {
            handleSendMessage(initialMessage);
        }
    }, [isOpen, autoSubmit, initialMessage, conversationStarted]);
    // Reset conversation state when closing
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            setConversationStarted(false);
            setIsProcessing(false);
            setAssistantResponse("");
            setMessage("");
        }
    }, [isOpen]);
    const handleSendMessage = async (messageToSend) => {
        const textToSend = messageToSend || message;
        if (!textToSend.trim())
            return;
        setConversationStarted(true);
        setIsProcessing(true);
        try {
            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Mock response based on the query type
            if (textToSend.includes("FROM logs*") || textToSend.includes("QSTR")) {
                setAssistantResponse(`The query **FROM logs* | WHERE QSTR("""term""")** performs the following operations:

1. **FROM logs***: This retrieves data from all indices, data streams, or aliases that match the pattern \`logs*\`. The wildcard \`*\` allows querying multiple indices that start with "logs".

2. **WHERE QSTR("""term""")**: This filters rows based on a query string query. The \`QSTR\` function evaluates whether the provided query string matches the row. In this case, the query string is \`"term"\`. It uses Lucene query string syntax to match rows where the term appears in the data.`);
            }
            else {
                setAssistantResponse(`I can help explain this code/text. Based on what you've selected, here are the key points to understand:

• **Context**: This appears to be part of an ES|QL query or code snippet
• **Functionality**: The selected text represents a specific operation or clause  
• **Usage**: This is commonly used for data querying and filtering operations

Would you like me to explain any specific part in more detail?`);
            }
        }
        catch (error) {
            setAssistantResponse("I apologize, but I encountered an error while processing your request. Please try again.");
        }
        finally {
            setIsProcessing(false);
        }
    };
    if (!isOpen)
        return null;
    const assistantCards = [
        {
            title: "Suggest",
            description: "Give me examples of questions I can ask here.",
            icon: "sparkles",
        },
        {
            title: "Explain",
            description: "Can you explain this page?",
            icon: "questionInCircle",
        },
        {
            title: "Alerts",
            description: "Do I have any alerts?",
            icon: "bell",
        },
        {
            title: "SLOs",
            description: "What are Service Level Objectives (SLOs)?",
            icon: "target",
        },
    ];
    return ((0, jsx_runtime_1.jsxs)(eui_1.EuiFlyout, { onClose: onClose, size: "600px", paddingSize: "l", ownFocus: true, hideCloseButton: false, closeButtonProps: {
            "aria-label": "Close assistant",
        }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutHeader, { hasBorder: true, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: "center", gutterSize: "m", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 56 64", fill: "none", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "iconGradientFlyout", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", style: { stopColor: "#61A2FF", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "50%", style: { stopColor: "#8A82E8", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", style: { stopColor: "#FF27A5", stopOpacity: 1 } })] }) }), (0, jsx_runtime_1.jsx)("path", { d: "M32 28H56V64H32V28Z", fill: "url(#iconGradientFlyout)" }), (0, jsx_runtime_1.jsx)("path", { d: "M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z", fill: "url(#iconGradientFlyout)" }), (0, jsx_runtime_1.jsx)("path", { d: "M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z", fill: "url(#iconGradientFlyout)" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 23C2 10.8497 11.8497 1 24 1V23H2Z", fill: "url(#iconGradientFlyout)" })] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiTitle, { size: "m", children: (0, jsx_runtime_1.jsx)("h2", { children: conversationStarted ? "Understanding FROM ..." : "New conversation" }) }) })] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutBody, { children: conversationStarted ? ((0, jsx_runtime_1.jsx)(eui_1.EuiCommentList, { comments: [
                        {
                            username: "You",
                            timestamp: "",
                            children: ((0, jsx_runtime_1.jsx)("div", { style: {
                                    backgroundColor: euiTheme.colors.lightestShade,
                                    padding: euiTheme.size.s,
                                    borderRadius: euiTheme.size.xs,
                                    fontSize: "14px",
                                    lineHeight: "1.4",
                                }, children: initialMessage || message })),
                            timelineAvatar: ((0, jsx_runtime_1.jsx)(eui_1.EuiAvatar, { name: "GU", size: "s", color: "#7DD3C0" })),
                            eventIcon: "user",
                            eventIconAriaLabel: "User message",
                        },
                        ...(isProcessing || assistantResponse ? [{
                                username: "Elastic Assistant",
                                timestamp: "",
                                children: ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: "14px", lineHeight: "1.4", color: euiTheme.colors.text }, children: isProcessing ? ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: euiTheme.size.xs }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "loading", size: "s" }), (0, jsx_runtime_1.jsx)("span", { children: "Thinking..." })] })) : ((0, jsx_runtime_1.jsx)("div", { dangerouslySetInnerHTML: {
                                            __html: assistantResponse
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/`(.*?)`/g, '<code style="background: #f5f7fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
                                                .replace(/\n\n/g, '</p><p>')
                                                .replace(/\n/g, '<br>')
                                                .replace(/^(.*)$/, '<p>$1</p>')
                                        } })) })),
                                timelineAvatar: ((0, jsx_runtime_1.jsx)("div", { style: {
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background: "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)",
                                        padding: "1px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                            width: "29px",
                                            height: "29px",
                                            borderRadius: "6px",
                                            backgroundColor: "#0B1628",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: (0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 56 64", fill: "none", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "iconGradientMessage", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", style: { stopColor: "#61A2FF", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "50%", style: { stopColor: "#8A82E8", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", style: { stopColor: "#FF27A5", stopOpacity: 1 } })] }) }), (0, jsx_runtime_1.jsx)("path", { d: "M32 28H56V64H32V28Z", fill: "url(#iconGradientMessage)" }), (0, jsx_runtime_1.jsx)("path", { d: "M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z", fill: "url(#iconGradientMessage)" }), (0, jsx_runtime_1.jsx)("path", { d: "M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z", fill: "url(#iconGradientMessage)" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 23C2 10.8497 11.8497 1 24 1V23H2Z", fill: "url(#iconGradientMessage)" })] }) }) })),
                                eventIcon: "logstashIf",
                                eventIconAriaLabel: "Assistant response",
                            }] : [])
                    ] })) : (
                // Initial state with cards
                (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: "200px",
                                marginBottom: euiTheme.size.xl,
                            }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "60px",
                                    border: `2px solid ${euiTheme.colors.lightShade}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: euiTheme.size.l,
                                    position: "relative",
                                }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "40px",
                                        border: `2px solid ${euiTheme.colors.lightShade}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "8px",
                                            background: "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)",
                                            padding: "1px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                width: "45px",
                                                height: "45px",
                                                borderRadius: "6px",
                                                backgroundColor: "#0B1628",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }, children: (0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "28", height: "28", viewBox: "0 0 56 64", fill: "none", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "iconGradientCenter", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", style: { stopColor: "#61A2FF", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "50%", style: { stopColor: "#8A82E8", stopOpacity: 1 } }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", style: { stopColor: "#FF27A5", stopOpacity: 1 } })] }) }), (0, jsx_runtime_1.jsx)("path", { d: "M32 28H56V64H32V28Z", fill: "url(#iconGradientCenter)" }), (0, jsx_runtime_1.jsx)("path", { d: "M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z", fill: "url(#iconGradientCenter)" }), (0, jsx_runtime_1.jsx)("path", { d: "M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z", fill: "url(#iconGradientCenter)" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 23C2 10.8497 11.8497 1 24 1V23H2Z", fill: "url(#iconGradientCenter)" })] }) }) }) }) }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexGrid, { columns: 2, gutterSize: "m", children: assistantCards.map((card, index) => ((0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiCard, { icon: (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: card.icon, size: "l" }), title: card.title, description: card.description, onClick: () => setMessage(card.description), selectable: {
                                        onClick: () => setMessage(card.description),
                                        isSelected: false,
                                    }, style: {
                                        cursor: "pointer",
                                        height: "120px",
                                    }, titleSize: "s", textAlign: "center" }) }, index))) }), (0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "xl" }), (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", color: "subdued", textAlign: "center", children: (0, jsx_runtime_1.jsx)("p", { children: "This conversation is powered by an integration with your LLM provider. LLMs are known to sometimes present incorrect information as if it's correct. Elastic supports configuration and connection to the LLM provider and your knowledge base, but is not responsible for the LLM's responses." }) })] })) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlyoutFooter, { children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: "center", gutterSize: "m", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiFieldText, { placeholder: "Send a message to the Assistant", value: message, onChange: (e) => setMessage(e.target.value), compressed: true, fullWidth: true, disabled: conversationStarted, onKeyDown: (e) => {
                                    if (e.key === 'Enter' && !conversationStarted) {
                                        handleSendMessage();
                                    }
                                } }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { iconType: "kqlFunction", size: "s", fill: true, onClick: () => handleSendMessage(), disabled: !message.trim() || conversationStarted }) })] }) })] }));
};
exports.AssistantFlyout = AssistantFlyout;
//# sourceMappingURL=AssistantFlyout.js.map