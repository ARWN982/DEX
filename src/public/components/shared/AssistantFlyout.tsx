import React, { useState, useRef, useEffect } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLoadingElastic,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { SiemReadinessAgentCard, type SiemReadinessAgentContext } from '../../pages/siem-readiness/SiemReadinessAgentCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isSiemResponse?: boolean;
}

interface AssistantFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  autoSubmit?: boolean;
  siemContext?: SiemReadinessAgentContext;
  onViewPillarData?: (pillarId: string) => void;
}

const AnthropicIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.39 5.61L15 7L9.39 8.39L8 14L6.61 8.39L1 7L6.61 5.61L8 0Z" fill="#D97707" />
  </svg>
);

export const AssistantFlyout: React.FC<AssistantFlyoutProps> = ({
  isOpen,
  onClose,
  initialMessage = '',
  autoSubmit = false,
  siemContext,
  onViewPillarData,
}) => {
  const [input, setInput] = useState(initialMessage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didAutoSubmit = useRef(false);

  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage);
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput('');
      setIsTyping(false);
      didAutoSubmit.current = false;
      return;
    }
    if (autoSubmit && initialMessage.trim() && !didAutoSubmit.current) {
      didAutoSubmit.current = true;
      handleSend(initialMessage);
    }
  }, [isOpen, autoSubmit, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    const isSiemQuery = /siem|readiness|coverage|quality|detections|continuity|retention|integration|ecs|ilm|rule field/i.test(text);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: isSiemQuery
            ? 'Here is your current SIEM Readiness status:'
            : `I'm reviewing your request. Based on your SIEM Readiness environment, I can help with coverage gaps, ECS quality issues, detection rule health, data continuity, and retention compliance.`,
          isSiemResponse: isSiemQuery,
        },
      ]);
      setIsTyping(false);
    }, 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <EuiFlyout
      type="push"
      side="right"
      size={560}
      onClose={onClose}
      hideCloseButton
      paddingSize="none"
      ownFocus={false}
      aria-labelledby="assistantFlyoutTitle"
      style={{
        top: 56,
        bottom: 8,
        marginLeft: 8,
        marginRight: 8,
        height: 'auto',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #d3dae6',
        background: '#fff',
      }}
    >
      <EuiFlyoutHeader hasBorder style={{ padding: '16px 20px', background: '#fff' }}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiButtonIcon iconType="menu" aria-label="Conversation history" color="text" size="s" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2 id="assistantFlyoutTitle" style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: '20px' }}>
                New Conversation
              </h2>
            </EuiTitle>
            <EuiText size="xs" color="subdued" style={{ marginTop: 2 }}>Elastic AI Agent</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon iconType="boxesVertical" aria-label="More options" color="text" size="s" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon iconType="cross" aria-label="Close" color="text" size="s" onClick={onClose} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>

      <EuiFlyoutBody style={{ background: '#fff', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 20px' }}>
          {messages.length === 0 && !isTyping ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
              <EuiTitle size="s">
                <h3 style={{ fontWeight: 400, color: '#1d2a3e', textAlign: 'center', margin: 0 }}>How can I help you?</h3>
              </EuiTitle>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    <div style={{
                      background: '#DDE8FB',
                      borderRadius: 8,
                      padding: '10px 14px',
                      width: '100%',
                    }}>
                      <EuiText size="s" style={{ color: '#1d2a3e' }}>{msg.content}</EuiText>
                    </div>
                  ) : msg.isSiemResponse && siemContext ? (
                    <SiemReadinessAgentCard
                      context={siemContext}
                      onViewData={(pillarId) => {
                        onViewPillarData?.(pillarId);
                        onClose();
                      }}
                    />
                  ) : msg.isSiemResponse ? (
                    <EuiText size="s" style={{ lineHeight: 1.6 }}>Here is your current SIEM Readiness status.</EuiText>
                  ) : (
                    <EuiText size="s" style={{ lineHeight: 1.6 }}>{msg.content}</EuiText>
                  )}
                </div>
              ))}
              {isTyping && (
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}><EuiLoadingElastic size="m" /></EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued" style={{ fontStyle: 'italic' }}>Planning my next step…</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </EuiFlyoutBody>

      <EuiFlyoutFooter style={{ background: '#fff', padding: '0 20px 20px', border: 'none' }}>
        <div style={{
          background: '#fff',
          border: `2px solid ${isInputFocused ? '#1750BA' : '#CAD3E2'}`,
          borderRadius: 16,
          padding: 16,
          boxShadow: '0px 0px 2px rgba(43,57,79,0.16), 0px 3px 5px rgba(43,57,79,0.1), 0px 6px 7px rgba(43,57,79,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <EuiTextArea
            placeholder="Ask anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            resize="none"
            fullWidth
            style={{
              border: 'none',
              boxShadow: 'none',
              outline: 'none',
              padding: 0,
              fontSize: 14,
              minHeight: 48,
              background: 'transparent',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}><AnthropicIcon /></EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued" style={{ fontWeight: 500 }}>Anthropic Claude Opus 4.6</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiButtonIcon
              iconType="arrowUp"
              color="primary"
              display="fill"
              size="s"
              aria-label="Send"
              onClick={() => handleSend()}
              isDisabled={!input.trim() || isTyping}
              style={{ borderRadius: 6 }}
            />
          </div>
        </div>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
