import React, { useState, useRef, useEffect } from 'react';
import {
  EuiButtonIcon,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiIcon,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

interface AIAgentPanelProps {
  onClose: () => void;
}

const AIAgentPanel: React.FC<AIAgentPanelProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const thinkingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Deciding what to do next...',
      loading: true,
    };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingMsg.id
            ? { ...m, content: getSimulatedResponse(text), loading: false }
            : m
        )
      );
      setIsThinking(false);
    }, 2200);
  };

  const getSimulatedResponse = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes('rules') && lower.includes('elastic')) {
      return 'Elastic offers over 1,500 prebuilt detection rules across SIEM, endpoint security, cloud, and more. These cover threats mapped to MITRE ATT&CK and are regularly updated by Elastic Security Labs.';
    }
    if (lower.includes('false positive')) {
      return 'To reduce false positives, consider tuning rule thresholds, adding exceptions for known-good processes, or using alert suppression to group recurring alerts.';
    }
    return 'I can help you with detection rules, threat hunting, alert triage, and security investigations. What would you like to know?';
  };

  return (
    <EuiFlyout
      type="push"
      side="right"
      size={560}
      onClose={onClose}
      hideCloseButton
      paddingSize="none"
      ownFocus={false}
      aria-labelledby="aiAgentFlyoutTitle"
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
      {/* Header */}
      <EuiFlyoutHeader hasBorder style={{ padding: '20px 24px', background: '#fff' }}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} gutterSize="m">
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2 id="aiAgentFlyoutTitle" style={{ marginBottom: 2 }}>New conversation</h2>
            </EuiTitle>
            <EuiText size="s" color="subdued">Elastic AI Agent</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon iconType="boxesHorizontal" aria-label="Menu" color="text" size="s" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon iconType="cross" aria-label="Close" color="text" size="s" onClick={onClose} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>

      {/* Messages area — lighter than page background */}
      <EuiFlyoutBody style={{ background: '#fafbfc', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EuiTitle size="s">
                <h3 style={{ fontWeight: 400, color: '#1a1c21', textAlign: 'center' }}>How can I help you?</h3>
              </EuiTitle>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'user' ? (
                    <div style={{
                      background: '#1D62A6',
                      color: '#fff',
                      borderRadius: '12px 12px 2px 12px',
                      padding: '8px 12px',
                      maxWidth: '80%',
                      fontSize: 13,
                      lineHeight: '18px',
                    }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ maxWidth: '90%' }}>
                      {msg.loading ? (
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                          <EuiFlexItem grow={false}><EuiIcon type="logoElastic" size="s" /></EuiFlexItem>
                          <EuiFlexItem>
                            <EuiText size="s" color="subdued" style={{ fontStyle: 'italic' }}>{msg.content}</EuiText>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      ) : (
                        <EuiText size="s" style={{ lineHeight: '20px' }}>{msg.content}</EuiText>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </EuiFlyoutBody>

      {/* Floating input card — 100% larger, floating above bottom */}
      <EuiFlyoutFooter style={{ background: '#fafbfc', padding: '0 20px 20px 20px', border: 'none' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #d3dae6',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          <EuiFieldText
            placeholder="Ask anything"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            fullWidth
            style={{ border: 'none', boxShadow: 'none', padding: '30px 20px 18px 20px', fontSize: 15, borderRadius: 0 }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px',
            borderTop: '1px solid #f0f2f5',
          }}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e7664c' }} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">Anthropic Claude Opus 4.6</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            {isThinking ? (
              <div
                onClick={() => { setIsThinking(false); setMessages(prev => prev.filter(m => !m.loading)); }}
                style={{ width: 20, height: 20, borderRadius: 4, background: '#343741', cursor: 'pointer', flexShrink: 0 }}
              />
            ) : (
              <EuiButtonIcon
                iconType="returnKey"
                aria-label="Send"
                size="xs"
                color="primary"
                onClick={handleSend}
                isDisabled={!input.trim()}
              />
            )}
          </div>
        </div>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

export default AIAgentPanel;
