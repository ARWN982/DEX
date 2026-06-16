import React, { useState, useRef, useEffect } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingElastic,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTextArea,
  EuiTitle,
  EuiAvatar,
} from '@elastic/eui';
import SecurityHeader from '../detection-rules/v1.0/components/SecurityHeader';
import SecuritySideNav from '../detection-rules/v1.0/components/SecuritySideNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageContent = 'text' | 'siem-readiness';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contentType?: MessageContent;
  timestamp: string;
}

// ─── SIEM Readiness AI response card ─────────────────────────────────────────

const PILLAR_DATA = [
  { label: 'Coverage',   status: 'Critical', statusColor: 'danger'   as const, metric: '42%', metricLabel: 'Rules with supporting data', metricColor: '#BD271E' },
  { label: 'Quality',    status: 'Critical', statusColor: 'danger'   as const, metric: '32',  metricLabel: 'Indices with field issues',   metricColor: '#BD271E' },
  { label: 'Continuity', status: 'Critical', statusColor: 'danger'   as const, metric: '2',   metricLabel: 'Volume drops (>50%)',           metricColor: '#BD271E' },
  { label: 'Retention',  status: 'Warning',  statusColor: 'warning'  as const, metric: '4',   metricLabel: 'Data streams below benchmark',  metricColor: '#CA8500' },
];

const ACTION_ITEMS = [
  { pillar: 'Coverage', severity: 'Critical', title: 'High failure rate: ds-auditbeat-9.1.0-2025.11.02-000015', description: '2.4% of docs are failing ingestion (1,320 of 55,000). Events are being dropped.', tags: ['5 rules affected', 'ds-auditbeat-9.1'] },
  { pillar: 'Coverage', severity: 'Critical', title: 'High failure rate: ds-auditbeat-9.1.0-2025.11.02-000015', description: '2.4% of docs are failing ingestion (1,320 of 55,000). Events are being dropped.', tags: ['5 rules affected', 'ds-auditbeat-9.1'] },
];

const SiemReadinessResponse: React.FC = () => (
  <div>
    {/* White panel wrapping the whole response */}
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 12, background: '#fff', marginBottom: 12 }}>
      {/* 2×2 pillar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#E0E5EF', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {PILLAR_DATA.map((p) => (
          <div key={p.label} style={{ background: '#fff', padding: '14px 16px' }}>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}><EuiText size="s"><strong>{p.label}</strong></EuiText></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color={p.statusColor}>{p.status}</EuiBadge></EuiFlexItem>
            </EuiFlexGroup>
            <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
              {p.metricLabel}:{' '}
              <strong style={{ color: p.metricColor }}>{p.metric}</strong>
            </EuiText>
          </div>
        ))}
      </div>

      {/* Actions heading */}
      <EuiText size="m" style={{ fontWeight: 700, marginBottom: 12 }}>
        {ACTION_ITEMS.length} Actions to take.
      </EuiText>

      {/* Action items */}
      {ACTION_ITEMS.map((action, idx) => (
        <div key={idx} style={{ marginBottom: idx < ACTION_ITEMS.length - 1 ? 20 : 0 }}>
          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{action.pillar}</EuiText>
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 4 }}>
            <EuiFlexItem grow={false}><EuiBadge color="danger">{action.severity}</EuiBadge></EuiFlexItem>
            <EuiFlexItem><EuiText size="s"><strong>{action.title}</strong></EuiText></EuiFlexItem>
          </EuiFlexGroup>
          <EuiText size="s" color="subdued" style={{ marginBottom: 6 }}>{action.description}</EuiText>
          <EuiFlexGroup gutterSize="xs" responsive={false}>
            {action.tags.map((tag) => (
              <EuiFlexItem key={tag} grow={false}><EuiBadge color="hollow">{tag}</EuiBadge></EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </div>
      ))}
    </EuiPanel>

    {/* Follow-up text */}
    <EuiText size="s" style={{ lineHeight: 1.6 }}>
      Would you like me to address these actions for you? I can create cases, suggest remediation steps, or walk you through fixing each issue one by one.
    </EuiText>
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const lines = message.content.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });

  return (
    <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false} direction={isUser ? 'rowReverse' : 'row'}>
      <EuiFlexItem grow={false}>
        {isUser
          ? <EuiAvatar size="s" name="AN" color="#0077CC" />
          : <EuiAvatar size="s" name="AI" color="#6B3C9F" iconType="productAgent" />
        }
      </EuiFlexItem>
      <EuiFlexItem style={{ maxWidth: '70%' }}>
        <EuiPanel
          hasBorder={!isUser}
          hasShadow={false}
          paddingSize="s"
          style={{ background: isUser ? '#F0F4FF' : undefined, borderRadius: 8 }}
        >
          <EuiText size="s" style={{ lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>{lines}</p>
          </EuiText>
        </EuiPanel>
        <EuiText size="xs" color="subdued" style={{ marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {message.timestamp}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

// ─── Anthropic asterisk icon ──────────────────────────────────────────────────

const AnthropicIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.39 5.61L15 7L9.39 8.39L8 14L6.61 8.39L1 7L6.61 5.61L8 0Z" fill="#D97707" />
  </svg>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const AgentsPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0 || isTyping;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isTyping]);

  // Reset to landing state when Agents nav item is clicked while already on this page
  useEffect(() => {
    const handler = () => {
      setMessages([]);
      setInputValue('');
      setIsInputFocused(false);
      setIsTyping(false);
    };
    window.addEventListener('agents-reset', handler);
    return () => window.removeEventListener('agents-reset', handler);
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: ts }]);
    setInputValue('');
    setIsTyping(true);
    const isSiemQuery = /siem|readiness|coverage|quality|continuity|retention/i.test(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        contentType: isSiemQuery ? 'siem-readiness' : 'text',
        content: isSiemQuery
          ? 'Here is your current SIEM Readiness status:'
          : `I'm reviewing your request: "${text}". Let me check the relevant detection data and rules in your environment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setIsTyping(false);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Input box — matches Figma 1773:92192 ────────────────────────────────────
  const InputBox = (
    <div style={{
      width: '100%',
      maxWidth: 760,
      background: '#fff',
      border: `2px solid ${isInputFocused ? '#1750BA' : '#CAD3E2'}`,
      borderRadius: 16,
      padding: 16,
      boxShadow: '0px 0px 2px rgba(43,57,79,0.16), 0px 3px 5px rgba(43,57,79,0.1), 0px 6px 7px rgba(43,57,79,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Text area — ~86px tall */}
      <EuiTextArea
        placeholder="Ask anything"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
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
          height: 86,
          minHeight: 86,
          background: 'transparent',
        }}
      />

      {/* Power bar — model left, send button pushed to far right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: model pill */}
        <EuiButtonEmpty size="s" color="text" flush="left">
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}><AnthropicIcon /></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiText size="xs" color="subdued" style={{ fontWeight: 500 }}>Anthropic Claude Opus 4.6</EuiText></EuiFlexItem>
          </EuiFlexGroup>
        </EuiButtonEmpty>

        {/* Right: send button */}
        <EuiButtonIcon
          iconType="arrowUp"
          color="primary"
          display="fill"
          size="s"
          aria-label="Send"
          onClick={handleSend}
          isDisabled={!inputValue.trim()}
          style={{ borderRadius: 6 }}
        />
      </div>
    </div>
  );

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{
        marginTop: 48,
        marginLeft: 80,
        minHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
      }}>

        {/* Three-dot menu — top right only */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px', flexShrink: 0 }}>
          <EuiButtonIcon iconType="boxesVertical" color="text" aria-label="More options" />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

          {!hasMessages ? (
            /* ── Landing state ── */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '40px 24px',
            }}>
              <EuiTitle size="l"><h2 style={{ fontWeight: 500, color: 'var(--euiTextColor)' }}>How can I help you?</h2></EuiTitle>
              <EuiSpacer size="xl" />
              {InputBox}
            </div>
          ) : (
            /* ── Conversation state ── */
            <>
              {/* Gradient background message area */}
              <div style={{
                flex: 1, overflowY: 'auto',
                background: 'linear-gradient(180deg, #EEF3FB 0%, #F5F8FD 60%, #fff 100%)',
                padding: '32px 0 24px',
              }}>
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>

                  {messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: 20 }}>
                      {msg.role === 'user' ? (
                        /* User message — full-width light-blue pill */
                        <div style={{
                          background: '#DDE8FB',
                          borderRadius: 8,
                          padding: '10px 16px',
                          width: '100%',
                        }}>
                          <EuiText size="s" style={{ color: 'var(--euiTextColor)' }}>{msg.content}</EuiText>
                        </div>
                      ) : (
                        /* AI response */
                        <div style={{ padding: '4px 0' }}>
                          {msg.contentType === 'siem-readiness'
                            ? <SiemReadinessResponse />
                            : (
                              <EuiText size="s" style={{ lineHeight: 1.6 }}>
                                {msg.content.split(/\*\*(.*?)\*\*/g).map((p, i) =>
                                  i % 2 === 1 ? <strong key={i}>{p}</strong> : p
                                )}
                              </EuiText>
                            )
                          }
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Reasoning / loading state — matches screenshot */}
                  {isTyping && (
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 16 }}>
                      <EuiFlexItem grow={false}><EuiLoadingElastic size="m" /></EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued" style={{ fontStyle: 'italic' }}>Planning my next step…</EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Full Figma input pinned at bottom */}
              <div style={{ padding: '16px 32px 20px', display: 'flex', justifyContent: 'center', background: '#fff', flexShrink: 0 }}>
                {/* Full-width Figma input with all power bar items */}
                <div style={{
                  width: '100%', maxWidth: 760,
                  background: '#fff', border: `2px solid ${isInputFocused ? '#1750BA' : '#CAD3E2'}`,
                  borderRadius: 16, padding: 16,
                  boxShadow: '0px 0px 2px rgba(43,57,79,0.16), 0px 3px 5px rgba(43,57,79,0.1), 0px 6px 7px rgba(43,57,79,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                  <EuiTextArea
                    placeholder="Ask a question"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    resize="none" fullWidth
                    style={{ border: 'none', boxShadow: 'none', outline: 'none', padding: 0, fontSize: 14, height: 60, minHeight: 60, background: 'transparent' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="plusInCircle" color="text" size="s" aria-label="Add" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty size="s" color="text" flush="left">
                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}><AnthropicIcon /></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiText size="xs" color="subdued" style={{ fontWeight: 500 }}>Sonnet 4.5</EuiText></EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty size="s" color="text" flush="both">
                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}><EuiLoadingElastic size="m" /></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiText size="xs">Elastic AI Agent</EuiText></EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="arrowUp" color="primary" display="fill" size="s"
                          aria-label="Send" onClick={handleSend} isDisabled={!inputValue.trim()}
                          style={{ borderRadius: 6 }}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentsPage;
