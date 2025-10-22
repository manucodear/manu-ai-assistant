import React, { useState } from 'react';
import { PromptProps } from './Prompt.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
// input UI moved to PromptInput
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Paper/Stack removed — no historic messages UI
// result UI moved into PromptResult
import PromptInput from './PromptInput';
import PromptResult from './PromptResult';
import PromptGeneration from './PromptGeneration';

interface ImagePromptTags {
  included: string[];
  notIncluded: string[];
}

interface ImagePromptResult {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  mainDifferences: string;
  tags: ImagePromptTags;
  pointOfViews: string[];
  // possible image styles returned by server
  imageStyles: string[];
  // raw singular PointOfView from server when present (may be empty string)
  pointOfViewRaw?: string | null;
  // raw singular ImageStyle from server when present (may be empty string)
  imageStyleRaw?: string | null;
  // selected image style (normalized)
  imageStyle?: string | null;
  // Conversation identifier returned by the backend for this prompt result
  conversationId: string;
}

// no message objects are stored in this flow; kept minimal

const Prompt: React.FC<PromptProps> = ({ value, onResetShowGallery }: PromptProps) => {
  const [input, setInput] = useState<string>(value ?? '');
  const [sending, setSending] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [evaluateMessage, setEvaluateMessage] = useState<string | null>(null);
  const [evaluateSeverity, setEvaluateSeverity] = useState<'success' | 'error' | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImagePromptResult | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // result UI is self-contained

  const sendPrompt = async (text: string) => {
    if (!text || !text.trim()) return;
    // clear any prior global error when the user initiates a new send
    // also clear prior evaluate alerts
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setGlobalError(null);
    // clear any previously generated image so a new result doesn't accidentally show it
    setGeneratedImageUrl(null);
    // no message history; just show sending state
    // keep a copy of the user's text so we can restore it on error
    const previousInput = text;
    // clear the input immediately when sending (optimistic UX)
    setInput('');
    setSending(true);
    // pendingMessage will be rendered inline in the input card until response

    try {
      const payload = { prompt: text, conversationId: conversationId ?? '' } as any;
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

      // The backend returns a canonical response with these exact keys:
      // originalPrompt, improvedPrompt, mainDifferences, tags.{included, notIncluded}, pointOfViews, pointOfView
      const promptResultRaw: any = parsed || {};
      // persist conversation id returned by backend for follow-up requests
      if (promptResultRaw.conversationId) setConversationId(String(promptResultRaw.conversationId));
      const tags = promptResultRaw.tags || {};
      const data: ImagePromptResult = {
        id: promptResultRaw.id ?? '',
        originalPrompt: promptResultRaw.originalPrompt ?? '',
        improvedPrompt: promptResultRaw.improvedPrompt ?? '',
        mainDifferences: promptResultRaw.mainDifferences ?? '',
        tags: { included: tags.included ?? [], notIncluded: tags.notIncluded ?? [] },
        pointOfViews: promptResultRaw.pointOfViews ?? [],
        // image styles list and raw selected style
        imageStyles: promptResultRaw.imageStyles ?? [],
        imageStyleRaw: promptResultRaw.imageStyle ?? null,
  // normalized selected imageStyle follows same logic as POV
  imageStyle: (promptResultRaw.hasOwnProperty('imageStyle') && promptResultRaw.imageStyle && String(promptResultRaw.imageStyle).trim()) ? String(promptResultRaw.imageStyle).trim() : (promptResultRaw.imageStyles && promptResultRaw.imageStyles[0]) ?? null,
        pointOfViewRaw: promptResultRaw.pointOfView ?? null,
        conversationId: String(promptResultRaw.conversationId ?? ''),
      };

      // Determine selected POV:
      // - If the server explicitly returned a PointOfView property (possibly empty), respect it:
      //    - non-empty -> select that value
      //    - empty string -> do not select any POV (null)
      // - If the server did NOT return a singular PointOfView, fall back to the first PointOfViews entry or null
      // set the image result and update messaging state
      setImageResult(data);
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      // On error, the render logic will show the PromptInput so the user can fix/retry
      // set a single global error message and reset the input/pending state
      setGlobalError(msg);
      // restore the user's text so they don't lose it on failure
      setInput(previousInput);
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => sendPrompt(input);

  // onEvaluate: called by PromptResult when user triggers Evaluate
  const onEvaluate = async (payload: any) => {
    // clear previous
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setEvaluating(true);
    const base = import.meta.env.VITE_BACKEND_URL || '';
    try {
      // Build request body in the format the backend expects
      // payload is expected to be an ImagePromptResult-like object from PromptResult
      const promptText = payload?.improvedPrompt ?? payload?.prompt ?? '';
      const toInclude: string[] = (payload?.tags?.included) ? [...payload.tags.included] : (payload?.tags?.toInclude ?? []);
      const originalIncluded: string[] = imageResult?.tags?.included ?? [];
      // tags to exclude = original included tags that are not in the selected toInclude set
      const toExclude = originalIncluded.filter((t) => !toInclude.includes(t));
      const pointOfView = payload?.pointOfViewRaw ?? payload?.pointOfView ?? '';

      const body = {
        prompt: promptText,
        tags: {
          toInclude,
          toExclude,
        },
        pointOfView,
      } as any;

      const res = await fetch(`${base}/imagePrompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      // expecting { revisedPrompt: string }
      const json = await res.json();
      // update conversation id if the server returned/rotated it
      if (json && json.conversationId) setConversationId(String(json.conversationId));
      const revised = (json && json.revisedPrompt) ? String(json.revisedPrompt) : '';
      if (revised && revised.trim()) {
        // invoke sendPrompt with the revised prompt returned by the evaluate endpoint
        await sendPrompt(revised);
        return;
      }
      // if no revisedPrompt provided, fall back to showing a success message
      setEvaluateMessage('Evaluation returned no revised prompt');
      setEvaluateSeverity('success');
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      setEvaluateMessage(msg);
      setEvaluateSeverity('error');
      // rethrow so child can react if needed
      throw err;
    } finally {
      setEvaluating(false);
    }
  };

  // onGenerate: called by PromptResult when user triggers Generate
  const onGenerate = async (result: ImagePromptResult) => {
    // hide input/result and show generating UI
    setGenerating(true);
    setGlobalError(null);
    setGeneratedImageUrl(null);
    try {
      const base = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${base}/Image/Generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imagePrompt: result
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const json = await res.json();
      const url = json?.image?.url ?? null;
      if (!url) throw new Error('No image URL returned');
      // success: show the generated image and keep input/result hidden
      setGeneratedImageUrl(url);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    // Reset to initial state: clear result and input, clear messages and errors
    setImageResult(null);
    setInput('');
    setGlobalError(null);
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setSending(false);
    setEvaluating(false);
    // clear generation state as well
    setGenerating(false);
    setGeneratedImageUrl(null);
    // clear conversation tracking as well
    setConversationId(null);
    // If page wants to show the gallery when resetting, call the callback
    try {
      if (typeof onResetShowGallery === 'function') onResetShowGallery();
    } catch (e) {
      // noop
    }
  };

  // key handling moved into PromptInput; keep sendPrompt available for direct calls

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Box sx={{ width: '100%', maxWidth: 980, mx: 'auto', px: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Evaluate alert (top) */}
        {evaluateMessage && evaluateSeverity === 'success' && (
          <Alert severity="success" sx={{ p: 1 }}>{evaluateMessage}</Alert>
        )}
        {evaluateMessage && evaluateSeverity === 'error' && (
          <Alert severity="error" sx={{ p: 1 }}>{`Error: ${evaluateMessage}`}</Alert>
        )}

        {/* show a single global error above the input when present */}
        {globalError && (
          <Alert severity="error" sx={{ p: 1 }}>
            {`Error: ${globalError}`}
          </Alert>
        )}
        {/* Top input area (split into PromptInput). The Prompt decides what to render:
            - initial: show the textarea + FAB (PromptInput)
            - after click Send: hide textarea and show a loading area
            - on success: show PromptResult (textarea remains hidden)
            - on error: show Alert and restore textarea */}
        {!sending && !imageResult && !evaluating ? (
          <PromptInput input={input} setInput={setInput} onSend={handleSendClick} sending={sending} />
        ) : sending || evaluating ? (
          <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <CircularProgress size={24} />
            <Box sx={{ color: 'text.secondary' }}>{evaluating ? 'Evaluating…' : 'Waiting for response…'}</Box>
          </Paper>
        ) : imageResult ? (
          generatedImageUrl ? (
            // show generated image while keeping prompt hidden
            <PromptGeneration 
              imageUrl={generatedImageUrl} 
              id={imageResult.id}
              onReset={handleReset}
              onShowPromptResult={(promptResult) => {
                setImageResult(promptResult);
                setGeneratedImageUrl(null);
              }}
            />
          ) : generating ? (
            <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <CircularProgress size={24} />
              <Box sx={{ color: 'text.secondary' }}>{'Generating image…'}</Box>
            </Paper>
          ) : (
            <PromptResult imageResult={imageResult} onEvaluate={onEvaluate} onReset={handleReset} onGenerate={onGenerate} generating={generating} conversationId={conversationId} setConversationId={setConversationId} />
          )
        ) : null}
      </Box>
    </Box>
  );
};

export default Prompt;
