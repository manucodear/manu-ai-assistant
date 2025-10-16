import React, { useState } from 'react';
import { PromptProps } from './Prompt.types';
import styles from './Prompt.module.css';
import { Spinner, Textarea } from '@fluentui/react-components';
import { Send16Regular } from '@fluentui/react-icons';

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
  const [showUserInput, setShowUserInput] = useState(true);
  const [imageResultMessageId, setImageResultMessageId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<MessageItem | null>(null);

  const [selectedIncluded, setSelectedIncluded] = useState<Record<string, boolean>>({});
  const [selectedNotIncluded, setSelectedNotIncluded] = useState<Record<string, boolean>>({});
  const [selectedPOVs, setSelectedPOVs] = useState<Record<string, boolean>>({});
  const [showDifferences, setShowDifferences] = useState(false);
  const [showTextarea, setShowTextarea] = useState<boolean>(true);

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

  // keep the new message as pending (don't add to messages list yet)
  setPendingMessage(newMessage);
  // clear the input immediately when sending
  setInput('');
  setSending(true);
  // hide the textarea immediately when send starts
  setShowTextarea(false);
  // pendingMessage will be rendered inline in the input card until response

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

  // Record which message corresponds to this image result so we can
  // hide/show the original user input for that message.
  setImageResultMessageId(tempId);
  setShowUserInput(false);

      const inc: Record<string, boolean> = {};
      const notInc: Record<string, boolean> = {};
      (data.Tags?.Included || []).forEach((t: string) => (inc[t] = true));
      (data.Tags?.NotIncluded || []).forEach((t: string) => (notInc[t] = false));
      setSelectedIncluded(inc);
      setSelectedNotIncluded(notInc);

      const povs: Record<string, boolean> = {};
      (data.PointOfViews || []).forEach((p: string) => (povs[p] = false));
      setSelectedPOVs(povs);

      // add the completed message to the messages list and associate it with the image result
      setMessages((prev: MessageItem[]) => [...prev, { ...newMessage, loading: false, error: null }]);
      setImageResultMessageId(tempId);
      setShowUserInput(false);
      setPendingMessage(null);
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      // On error, re-show the textarea so the user can fix/retry
      setShowTextarea(true);
      // add the failed message into the list with the error
      setMessages((prev: MessageItem[]) => [...prev, { ...newMessage, loading: false, error: msg }]);
      setPendingMessage(null);
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
      <div className={styles.contentInner}>
      {/* Top area: show the input card (textarea or improved prompt) with send button */}
      <div className={styles.promptRow}>
        <div className={styles.inputArea}>
          <div className={styles.inputCard}>
            {showTextarea ? (
              <Textarea
                className={styles.nativeTextarea}
                value={input}
                onChange={(_e, data) => setInput(data.value)}
                placeholder="Type a prompt and press Send"
                appearance="outline"
                rows={4}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
            ) : imageResult ? (
              <div className={styles.messageCard}>
                <div className={styles.subTitle}>Improved prompt</div>
                <div className={styles.improvedPrompt}>{imageResult.ImprovedPrompt}</div>

                {imageResult.MainDifferences && (
                  <div className={styles.differencesSection}>
                    <button type="button" onClick={() => setShowDifferences((s) => !s)} className={styles.differencesButton}>
                      {showDifferences ? 'Hide main differences' : 'Show main differences'}
                    </button>

                    {showDifferences && <div className={styles.differencesText}>{imageResult.MainDifferences}</div>}
                  </div>
                )}
              </div>
            ) : (
              // No textarea and no image result yet: show the pending message inline (user prompt + spinner)
              (() => {
                const pending = pendingMessage;
                if (pending) {
                  return (
                    <div className={styles.messageCard} aria-live="polite">
                      <div className={styles.cardColumn}>
                        <div className={styles.userPrompt + ' ' + styles.userPromptFlex}>{pending.userPrompt}</div>
                      </div>

                      {pending.loading && (
                        <div className={styles.loadingRow}>
                          <Spinner size="small" />
                          <span className={styles.loadingText}>Waiting for response…</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return <div aria-hidden="true" />;
              })()
            )}
          </div>

          <div className={styles.sendTopColumn}>
            <button
              className={styles.sendIconButton}
              onClick={handleSendClick}
              disabled={sending || !input.trim()}
              aria-label="Send prompt"
              title="Send prompt"
            >
              <Send16Regular aria-hidden="true" focusable={false} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages
          .filter((m) => !(m.id && imageResultMessageId && m.id === imageResultMessageId))
          .map((m: MessageItem, idx: number) => (
            <div key={idx} className={styles.messageCard} aria-live="polite">
              {/* If this message is the one that produced the imageResult and showUserInput is false,
                  hide the user prompt; otherwise show it. */}
              <div className={styles.cardColumn}>
                <div className={styles.userPrompt + ' ' + styles.userPromptFlex}>{m.userPrompt}</div>
              </div>

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
        <>
          {/* Tags / POVs / Chips card */}
          <div className={styles.messageCard}>
            <div className={styles.tagsSection}>
              <div className={styles.tagsTitle}>Tags</div>

              <div className={styles.tagsRowFlex}>
                <select
                  multiple
                  size={6}
                  className={styles.tagSelect}
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
                  className={styles.tagSelect}
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
                <div className={styles.povWrapper}>
                  <div className={styles.subTitle}>Point of views</div>
                  <select
                    multiple
                    size={Math.min(6, imageResult.PointOfViews.length)}
                    className={styles.povSelect}
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

          {/* Show/hide original input card */}
          <div className={styles.messageCard}>
            <div className={styles.cardColumn}>
              <div>
                <button type="button" onClick={() => setShowUserInput((s) => !s)} className={styles.toggleButton}>
                  {showUserInput ? 'Hide original input' : 'Show original input'}
                </button>
              </div>

              <div className={styles.userPrompt} style={{ marginTop: 8 }}>
                {showUserInput ? imageResult.OriginalPrompt : null}
              </div>
            </div>
          </div>
        </>
      )}

      {/* bottom send button removed — only the top send button remains */}
      </div>
    </div>
  );
};

export default Prompt;
