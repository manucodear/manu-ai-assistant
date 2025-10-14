import React, { useState } from 'react';
import { PromptProps } from './Prompt.types';
import styles from './Prompt.module.css';
import { Textarea, Button, Spinner } from '@fluentui/react-components';

interface ChatResponse {
  id: string;
  suggestions: string[];
  conversation: string;
}

interface MessageItem {
  // optional id returned by backend for the conversation (only on response)
  id?: string;
  userPrompt: string;
  suggestions: string[];
  conversation: string;
  loading: boolean;
  error?: string | null;
}

const Prompt: React.FC<PromptProps> = ({ value }) => {
  const [input, setInput] = useState<string>(value ?? '');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const sendPrompt = async (text: string) => {
    if (!text || !text.trim()) return;

    // Create a local message entry so the user sees their prompt immediately
    const newMessage: MessageItem = {
      userPrompt: text,
      suggestions: [],
      conversation: '',
      loading: true,
      error: null,
    };

    setMessages((m) => [...m, newMessage]);
    setInput(''); // clear the input as requested
    setSending(true);

    try {
      const payload = { Prompt: text } as any;

      const base = import.meta.env.VITE_BACKEND_URL || '';
      const url = chatId ? `${base}/chat/${encodeURIComponent(chatId)}` : `${base}/chat`;
      const method = chatId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as ChatResponse;

      // Update chatId if it's the first response
      if (data?.id && !chatId) setChatId(data.id);

      // Replace the last message (the one we just pushed) with the response data
      setMessages((prev) => {
        const copy = [...prev];
        // find last message that is loading and has same userPrompt
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].loading && copy[i].userPrompt === text) {
            copy[i] = {
              ...copy[i],
              id: data.id,
              suggestions: data.suggestions || [],
              conversation: data.conversation || '',
              loading: false,
              error: null,
            };
            break;
          }
        }
        return copy;
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      // mark last message as errored
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].loading && copy[i].userPrompt === text) {
            copy[i] = { ...copy[i], loading: false, error: msg };
            break;
          }
        }
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    sendPrompt(input);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendPrompt(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // copy suggestion into input for user to edit or resend
    setInput(suggestion);
  };

  return (
    <div className={styles.container}>
      <div className={styles.promptRow}>
        <Textarea
          value={input}
          onChange={(_e, data) => setInput(data.value)}
          placeholder="Type a prompt and press Send (or Ctrl+Enter)"
          rows={4}
          resize="vertical"
          onKeyDown={handleKeyDown}
          disabled={sending}
        />

        <div className={styles.actions}>
          <Button
            appearance="primary"
            onClick={handleSendClick}
            disabled={sending || !input.trim()}
          >
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((m, idx) => (
          <div key={idx} className={styles.messageCard} aria-live="polite">
            <div className={styles.userPrompt}>{m.userPrompt}</div>

            {m.loading && (
              <div className={styles.loadingRow}>
                <Spinner size="small" />
                <span className={styles.loadingText}>Waiting for response…</span>
              </div>
            )}

            {m.error && <div className={styles.error}>Error: {m.error}</div>}

            {/* Suggestions rendered as chips */}
            {m.suggestions && m.suggestions.length > 0 && (
              <div className={styles.chipsRow}>
                {m.suggestions.map((s, i) => (
                  <button
                    key={i}
                    className={styles.chip}
                    onClick={() => handleSuggestionClick(s)}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation content */}
            {m.conversation && <div className={styles.conversation}>{m.conversation}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prompt;
