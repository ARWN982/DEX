import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiText,
  EuiCard,
  EuiIcon,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiSpacer,
  EuiCommentList,
  EuiAvatar,
  useEuiTheme,
} from "@elastic/eui";
import React, { useState, useEffect } from "react";

interface AssistantFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  autoSubmit?: boolean;
}

export const AssistantFlyout: React.FC<AssistantFlyoutProps> = ({
  isOpen,
  onClose,
  initialMessage,
  autoSubmit,
}) => {
  const { euiTheme } = useEuiTheme();
  const [message, setMessage] = useState(initialMessage || "");
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState("");

  // Update message when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Auto-submit when flyout opens with autoSubmit flag
  useEffect(() => {
    if (isOpen && autoSubmit && initialMessage && !conversationStarted) {
      handleSendMessage(initialMessage);
    }
  }, [isOpen, autoSubmit, initialMessage, conversationStarted]);

  // Reset conversation state when closing
  useEffect(() => {
    if (!isOpen) {
      setConversationStarted(false);
      setIsProcessing(false);
      setAssistantResponse("");
      setMessage("");
    }
  }, [isOpen]);

  const handleSendMessage = async (messageToSend?: string) => {
    const textToSend = messageToSend || message;
    if (!textToSend.trim()) return;

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
      } else {
        setAssistantResponse(`I can help explain this code/text. Based on what you've selected, here are the key points to understand:

• **Context**: This appears to be part of an ES|QL query or code snippet
• **Functionality**: The selected text represents a specific operation or clause  
• **Usage**: This is commonly used for data querying and filtering operations

Would you like me to explain any specific part in more detail?`);
      }
    } catch (error) {
      setAssistantResponse("I apologize, but I encountered an error while processing your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

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

  return (
    <EuiFlyout
      onClose={onClose}
      size="600px"
      paddingSize="l"
      ownFocus
      hideCloseButton={false}
      closeButtonProps={{
        "aria-label": "Close assistant",
      }}
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 56 64"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="iconGradientFlyout"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#61A2FF", stopOpacity: 1 }}
                  />
                  <stop
                    offset="50%"
                    style={{ stopColor: "#8A82E8", stopOpacity: 1 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#FF27A5", stopOpacity: 1 }}
                  />
                </linearGradient>
              </defs>
              <path d="M32 28H56V64H32V28Z" fill="url(#iconGradientFlyout)" />
              <path
                d="M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z"
                fill="url(#iconGradientFlyout)"
              />
              <path
                d="M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z"
                fill="url(#iconGradientFlyout)"
              />
              <path
                d="M2 23C2 10.8497 11.8497 1 24 1V23H2Z"
                fill="url(#iconGradientFlyout)"
              />
            </svg>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2>{conversationStarted ? "Understanding FROM ..." : "New conversation"}</h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {conversationStarted ? (
          <EuiCommentList
            comments={[
              {
                username: "You",
                timestamp: "",
                children: (
                  <div
                    style={{
                      backgroundColor: euiTheme.colors.lightestShade,
                      padding: euiTheme.size.s,
                      borderRadius: euiTheme.size.xs,
                      fontSize: "14px",
                      lineHeight: "1.4",
                    }}
                  >
                    {initialMessage || message}
                  </div>
                ),
                timelineAvatar: (
                  <EuiAvatar name="GU" size="s" color="#7DD3C0" />
                ),
                eventIcon: "user",
                eventIconAriaLabel: "User message",
              },
              ...(isProcessing || assistantResponse ? [{
                username: "Elastic Assistant",
                timestamp: "",
                children: (
                  <div style={{ fontSize: "14px", lineHeight: "1.4", color: euiTheme.colors.text }}>
                    {isProcessing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: euiTheme.size.xs }}>
                        <EuiIcon type="loading" size="s" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ 
                        __html: assistantResponse
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code style="background: #f5f7fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n/g, '<br>')
                          .replace(/^(.*)$/, '<p>$1</p>')
                      }} />
                    )}
                  </div>
                ),
                timelineAvatar: (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)",
                      padding: "1px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "29px",
                        height: "29px",
                        borderRadius: "6px",
                        backgroundColor: "#0B1628",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 56 64"
                        fill="none"
                      >
                        <defs>
                          <linearGradient
                            id="iconGradientMessage"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" style={{ stopColor: "#61A2FF", stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: "#8A82E8", stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: "#FF27A5", stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <path d="M32 28H56V64H32V28Z" fill="url(#iconGradientMessage)" />
                        <path
                          d="M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z"
                          fill="url(#iconGradientMessage)"
                        />
                        <path
                          d="M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z"
                          fill="url(#iconGradientMessage)"
                        />
                        <path
                          d="M2 23C2 10.8497 11.8497 1 24 1V23H2Z"
                          fill="url(#iconGradientMessage)"
                        />
                      </svg>
                    </div>
                  </div>
                ),
                eventIcon: "logstashIf",
                eventIconAriaLabel: "Assistant response",
              }] : [])
            ]}
          />
        ) : (
          // Initial state with cards
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                marginBottom: euiTheme.size.xl,
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "60px",
                  border: `2px solid ${euiTheme.colors.lightShade}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: euiTheme.size.l,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "40px",
                    border: `2px solid ${euiTheme.colors.lightShade}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      background: "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)",
                      padding: "1px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "45px",
                        height: "45px",
                        borderRadius: "6px",
                        backgroundColor: "#0B1628",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 56 64"
                        fill="none"
                      >
                        <defs>
                          <linearGradient
                            id="iconGradientCenter"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" style={{ stopColor: "#61A2FF", stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: "#8A82E8", stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: "#FF27A5", stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <path d="M32 28H56V64H32V28Z" fill="url(#iconGradientCenter)" />
                        <path
                          d="M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z"
                          fill="url(#iconGradientCenter)"
                        />
                        <path
                          d="M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z"
                          fill="url(#iconGradientCenter)"
                        />
                        <path
                          d="M2 23C2 10.8497 11.8497 1 24 1V23H2Z"
                          fill="url(#iconGradientCenter)"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <EuiFlexGrid columns={2} gutterSize="m">
              {assistantCards.map((card, index) => (
                <EuiFlexItem key={index}>
                  <EuiCard
                    icon={<EuiIcon type={card.icon} size="l" />}
                    title={card.title}
                    description={card.description}
                    onClick={() => setMessage(card.description)}
                    selectable={{
                      onClick: () => setMessage(card.description),
                      isSelected: false,
                    }}
                    style={{
                      cursor: "pointer",
                      height: "120px",
                    }}
                    titleSize="s"
                    textAlign="center"
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGrid>

            <EuiSpacer size="xl" />

            <EuiText size="s" color="subdued" textAlign="center">
              <p>
                This conversation is powered by an integration with your LLM
                provider. LLMs are known to sometimes present incorrect information
                as if it's correct. Elastic supports configuration and connection to
                the LLM provider and your knowledge base, but is not responsible for
                the LLM's responses.
              </p>
            </EuiText>
          </>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiFieldText
              placeholder="Send a message to the Assistant"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              compressed
              fullWidth
              disabled={conversationStarted}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !conversationStarted) {
                  handleSendMessage();
                }
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="kqlFunction"
              size="s"
              fill
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || conversationStarted}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};