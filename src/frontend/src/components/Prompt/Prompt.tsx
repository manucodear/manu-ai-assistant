import React, { useState } from 'react';
import { PromptProps } from './Prompt.types';
import styles from './Prompt.module.css';
import { Textarea, Button, Spinner } from '@fluentui/react-components';

interface ImagePromptTags {
  Included: string[];
  NotIncluded: string[];
}

interface ImagePromptResult {
  OriginalPrompt: string;
  ImprovedPrompt: string;
  MainDifferences: string;
  Tags: ImagePromptTags;
  PointOfViews: string[];
}

interface MessageItem {
  id?: string;
  userPrompt: string;
  suggestions: string[];
  conversation: string;
  loading: boolean;
  error?: string | null;
  isImagePrompt?: boolean;
}

const Prompt: React.FC<PromptProps> = ({ value }: PromptProps) => {
  const [input, setInput] = useState<string>(value ?? '');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sending, setSending] = useState(false);
  const [imageResult, setImageResult] = useState<ImagePromptResult | null>(null);

  const [selectedIncluded, setSelectedIncluded] = useState<Record<string, boolean>>({});
  const [selectedNotIncluded, setSelectedNotIncluded] = useState<Record<string, boolean>>({});
  const [selectedPOVs, setSelectedPOVs] = useState<Record<string, boolean>>({});
  const [showDifferences, setShowDifferences] = useState(false);

  const sendPrompt = async (text: string) => {
    if (!text || !text.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newMessage: MessageItem = {
      id: tempId,
      userPrompt: text,
      suggestions: [],
      conversation: '',
      loading: true,
      error: null,
      isImagePrompt: true,
    };

    setMessages((m: MessageItem[]) => [...m, newMessage]);
    setInput('');
    setSending(true);

    try {
      const payload = { prompt: text } as any;
      const base = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${base}/imagePrompt`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const raw = await res.text();
      let parsed: any = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (e) {
        parsed = null;
      }

      if (!parsed) throw new Error('Empty or invalid JSON response from server');

      const data = ((): ImagePromptResult => {
        const d: any = parsed || {};
        const tags = d.Tags || d.tags || {};
        return {
          OriginalPrompt: d.OriginalPrompt ?? d.originalPrompt ?? d.original ?? '',
          ImprovedPrompt: d.ImprovedPrompt ?? d.improvedPrompt ?? d.improved ?? '',
          MainDifferences: d.MainDifferences ?? d.mainDifferences ?? d.mainDifferencesText ?? '',
          Tags: {
            Included: tags.Included ?? tags.included ?? tags.includedTags ?? [],
            NotIncluded: tags.NotIncluded ?? tags.notIncluded ?? tags.notIncludedTags ?? [],
          },
          PointOfViews: d.PointOfViews ?? d.pointOfViews ?? d.pointOfViewsList ?? [],
        } as ImagePromptResult;
      })();

      setImageResult(data);

      const inc: Record<string, boolean> = {};
      const notInc: Record<string, boolean> = {};
      (data.Tags?.Included || []).forEach((t: string) => (inc[t] = true));
      (data.Tags?.NotIncluded || []).forEach((t: string) => (notInc[t] = false));
      setSelectedIncluded(inc);
      setSelectedNotIncluded(notInc);

      const povs: Record<string, boolean> = {};
      (data.PointOfViews || []).forEach((p: string) => (povs[p] = false));
      setSelectedPOVs(povs);

      setMessages((prev: MessageItem[]) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].id && copy[i].id === tempId) {
            copy[i] = { ...copy[i], loading: false, error: null, conversation: '' };
            return copy;
          }
        }
        return copy;
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      setMessages((prev: MessageItem[]) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].id && copy[i].id === tempId) {
            copy[i] = { ...copy[i], loading: false, error: msg };
            return copy;
          }
        }
        copy.push({ userPrompt: text, suggestions: [], conversation: '', loading: false, error: msg });
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => sendPrompt(input);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    const ev = e as React.KeyboardEvent<HTMLTextAreaElement>;
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      sendPrompt(input);
    }
    if (ev.key === 'Enter' && !ev.ctrlKey && !ev.metaKey && input.trim()) {
      ev.preventDefault();
      sendPrompt(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => setInput(suggestion);

  return (
    <div className={styles.container}>
      <div className={styles.promptRow}>
        {!imageResult && (
          <Textarea
            value={input}
            onChange={(_e: any, data: any) => setInput(data.value)}
            placeholder="Type a prompt and press Send"
            rows={4}
            resize="vertical"
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
        )}

        <div className={styles.actions}>
          <Button appearance="primary" onClick={handleSendClick} disabled={sending || !input.trim()} aria-label="Send prompt">
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((m: MessageItem, idx: number) => (
          <div key={idx} className={styles.messageCard} aria-live="polite">
            <div className={styles.userPrompt}>{m.userPrompt}</div>

            {m.loading && (
              <div className={styles.loadingRow}>
                <Spinner size="small" />
                <span className={styles.loadingText}>Waiting for response…</span>
              </div>
            )}

            {m.error && <div className={styles.error}>Error: {m.error}</div>}

            {m.suggestions && m.suggestions.length > 0 && (
              <div className={styles.chipsRow}>
                {m.suggestions.map((s: string, i: number) => (
                  <button key={i} className={styles.chip} onClick={() => handleSuggestionClick(s)} type="button">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {m.conversation && <div className={styles.conversation}>{m.conversation}</div>}
          </div>
        ))}
      </div>

      {imageResult && (
        <div className={styles.messageCard}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Original prompt (deprecated/replaced)</div>
          <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap' }}>{imageResult.OriginalPrompt}</div>

          <div style={{ fontWeight: 700, marginBottom: 8 }}>Improved prompt</div>
          <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap' }}>{imageResult.ImprovedPrompt}</div>

          {imageResult.MainDifferences && (
            <div style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setShowDifferences((s) => !s)}
                style={{
                  background: 'transparent',
                  border: '1px solid #3a3a3a',
                  color: '#e6e6e6',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                {showDifferences ? 'Hide main differences' : 'Show main differences'}
              </button>

              {showDifferences && <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{imageResult.MainDifferences}</div>}
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Tags</div>

            <div style={{ display: 'flex', gap: 12 }}>
              <select
                multiple
                size={6}
                style={{ minWidth: 220, background: '#1e1e1e', color: '#e6e6e6', border: '1px solid #3a3a3a', padding: 6 }}
                onChange={(e: any) => {
                  const selected = Array.from(e.target.selectedOptions).map((o: any) => o.value);
                  const incMap: Record<string, boolean> = {};
                  (imageResult.Tags?.Included || []).forEach((t: string) => (incMap[t] = selected.includes(t)));
                  setSelectedIncluded(incMap);
                }}
                value={(imageResult.Tags?.Included || []).filter((t: string) => selectedIncluded[t])}
              >
                <optgroup label="Included">
                  {(imageResult.Tags?.Included || []).map((t: string) => (
                    <option key={`inc-opt-${t}`} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              </select>

              <select
                multiple
                size={6}
                style={{ minWidth: 220, background: '#1e1e1e', color: '#e6e6e6', border: '1px solid #3a3a3a', padding: 6 }}
                onChange={(e: any) => {
                  const selected = Array.from(e.target.selectedOptions).map((o: any) => o.value);
                  const notMap: Record<string, boolean> = {};
                  (imageResult.Tags?.NotIncluded || []).forEach((t: string) => (notMap[t] = selected.includes(t)));
                  setSelectedNotIncluded(notMap);
                }}
                value={(imageResult.Tags?.NotIncluded || []).filter((t: string) => selectedNotIncluded[t])}
              >
                <optgroup label="Not included">
                  {(imageResult.Tags?.NotIncluded || []).map((t: string) => (
                    <option key={`not-opt-${t}`} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {imageResult.PointOfViews && imageResult.PointOfViews.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>Point of views</div>
                <select
                  multiple
                  size={Math.min(6, imageResult.PointOfViews.length)}
                  style={{ minWidth: 460, background: '#1e1e1e', color: '#e6e6e6', border: '1px solid #3a3a3a', padding: 6 }}
                  onChange={(e: any) => {
                    const selected = Array.from(e.target.selectedOptions).map((o: any) => o.value);
                    const povMap: Record<string, boolean> = {};
                    (imageResult.PointOfViews || []).forEach((p: string) => (povMap[p] = selected.includes(p)));
                    setSelectedPOVs(povMap);
                  }}
                  value={(imageResult.PointOfViews || []).filter((p: string) => selectedPOVs[p])}
                >
                  {(imageResult.PointOfViews || []).map((p: string) => (
                    <option key={`pov-opt-${p}`} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.chipsRow} style={{ marginTop: 8 }}>
            {Object.keys(selectedIncluded)
              .filter((k) => selectedIncluded[k])
              .map((t: string) => (
                <div key={`chip-inc-${t}`} className={styles.chip} style={{ background: '#224a2f', borderColor: '#2f6b43' }}>
                  {t}
                </div>
              ))}

            {Object.keys(selectedNotIncluded)
              .filter((k) => selectedNotIncluded[k])
              .map((t: string) => (
                <div key={`chip-not-${t}`} className={styles.chip} style={{ background: '#31343a', borderColor: '#464a50' }}>
                  {t}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Prompt;
