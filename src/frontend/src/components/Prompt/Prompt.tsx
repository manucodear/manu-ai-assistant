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
import ImageGallery from '../ImageGallery/ImageGallery';
import ImageActionSelector from '../ImageActionSelector/ImageActionSelector';
import useImagePrompt from '../../hooks/useImagePrompt';
import { ImagePromptResult } from './Prompt.types';

 

// no message objects are stored in this flow; kept minimal

const Prompt: React.FC<PromptProps> = ({ value }: PromptProps) => {
  // Prompt now owns its own UI state: active tab (generate/gallery) and whether a prompt result view is showing
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
  const [isShowingPromptResult, setIsShowingPromptResult] = useState<boolean>(false);
  const [input, setInput] = useState<string>(value ?? '');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [evaluateMessage, setEvaluateMessage] = useState<string | null>(null);
  const [evaluateSeverity, setEvaluateSeverity] = useState<'success' | 'error' | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<any | null>(null);
  const {
    sendPrompt: hookSendPrompt,
    evaluatePrompt: hookEvaluatePrompt,
    generateImage: hookGenerateImage,
    sending: hookSending,
    evaluating: hookEvaluating,
    generating: hookGenerating,
    conversationId: hookConversationId,
    setConversationId: hookSetConversationId,
    getPromptResultById: hookGetPromptResultById,
  } = useImagePrompt();

  const disable = hookSending;
  const evaluating = hookEvaluating;
  const generating = hookGenerating;
  const conversationId = hookConversationId;
  // result UI is self-contained

  const sendPrompt = async (text: string) => {
    if (!text || !text.trim()) return;
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setGlobalError(null);
    setGeneratedImageUrl(null);
    const previousInput = text;
    setInput('');
    try {
      const data = await hookSendPrompt(text);
      setImageResult(data);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
      setInput(previousInput);
    }
  };

  const handleSendClick = () => sendPrompt(input);

  // onEvaluate: called by PromptResult when user triggers Evaluate
  const onEvaluate = async (payload: any) => {
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    try {
      // Build request body in the format the backend expects
      const promptText = payload?.improvedPrompt ?? payload?.prompt ?? '';
      const toInclude: string[] = (payload?.tags?.included) ? [...payload.tags.included] : (payload?.tags?.toInclude ?? []);
      const originalIncluded: string[] = imageResult?.tags?.included ?? [];
      const toExclude = originalIncluded.filter((t) => !toInclude.includes(t));
      const pointOfView = payload?.pointOfViewRaw ?? payload?.pointOfView ?? '';

      const body = {
        prompt: promptText,
        tags: { toInclude, toExclude },
        pointOfView,
      } as any;

      const json = await hookEvaluatePrompt(body);
      if (json && json.conversationId) hookSetConversationId(String(json.conversationId));
      const revised = (json && json.revisedPrompt) ? String(json.revisedPrompt) : '';
      if (revised && revised.trim()) {
        await sendPrompt(revised);
        return;
      }
      setEvaluateMessage('Evaluation returned no revised prompt');
      setEvaluateSeverity('success');
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      setEvaluateMessage(msg);
      setEvaluateSeverity('error');
      throw err;
    }
  };

  const handleGalleryShowPromptResult = async (result: any) => {
    try {
      if (!result) {
        // No id => gallery is requesting the prompt input view
        setIsShowingPromptResult(false);
        setActiveTab('generate');
        return;
      }
      // If the gallery passed an id string, fetch the prompt result via the hook
      if (typeof result === 'string') {
        const json = await hookGetPromptResultById(result);
        setImageResult(json);
        setIsShowingPromptResult(Boolean(json));
        return;
      }
      // If the gallery passed the full object, use it directly
      setImageResult(result as any);
      setIsShowingPromptResult(true);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
      setIsShowingPromptResult(true);
    }
  };

  // onGenerate: called by PromptResult when user triggers Generate
  const onGenerate = async (result: ImagePromptResult) => {
    setGlobalError(null);
    setGeneratedImageUrl(null);
    try {
      const url = await hookGenerateImage(result as any);
      setGeneratedImageUrl(url);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
    }
  };

  const handleReset = () => {
    // Reset to initial state: clear result and input, clear messages and errors
    setImageResult(null);
    setInput('');
    setGlobalError(null);
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    // clear generation state as well
    // Note: sending/evaluating/generating flags are managed by the hook; we cannot directly set them here.
    setGeneratedImageUrl(null);
    // clear conversation tracking as well
    hookSetConversationId(null);
    // Note: do NOT automatically call onResetShowGallery here. The gallery/tab
    // switching should be controlled by the page that renders Prompt (e.g. Image.tsx)
    // so main flow Reset returns to the prompt input as expected.
  };

  // key handling moved into PromptInput; keep sendPrompt available for direct calls

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', flex: 1 }}>
      <Box sx={{ width: '100%', maxWidth: { xs: 980, md: '100%' }, mx: { xs: 'auto', md: 0 }, px: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Image action selector (Create / Gallery) — Prompt controls the actions internally */}
        <ImageActionSelector
          activeTab={activeTab}
          isShowingPromptResult={isShowingPromptResult}
          onShowGenerate={() => { setActiveTab('generate'); setIsShowingPromptResult(false); }}
        onShowGallery={() => {
            setActiveTab('gallery');
            setIsShowingPromptResult(false);
            // clear any existing result so the gallery view is clean
            setImageResult(null);
            setGeneratedImageUrl(null);
          }}
        />
        {/* Include the ImageGallery inside the Prompt layout when the gallery tab is active */}
        {activeTab === 'gallery' && (
          <ImageGallery
            onShowPromptResult={handleGalleryShowPromptResult}
          />
        )}

        {/* When in generate tab, show alerts and input/result. Gallery is exclusive. */}
        {activeTab === 'generate' && (
          <>
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
            {!disable && !imageResult && !evaluating ? (
              <PromptInput input={input} setInput={setInput} onSend={handleSendClick} disable={disable} />
            ) : disable || evaluating ? (
              <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Box sx={{ color: 'text.secondary' }}>{evaluating ? 'Evaluating\u2026' : 'Waiting for response\u2026'}</Box>
              </Paper>
            ) : imageResult ? (
              generatedImageUrl ? (
                // show generated image while keeping prompt hidden
                <PromptGeneration
                  imageUrl={generatedImageUrl}
                  imagePromptId={imageResult.imagePromptId}
                  onReset={handleReset}
                  onShowPromptResult={async (promptResult) => {
                    try {
                      if (!promptResult) {
                        handleReset();
                        return;
                      }
                      if (typeof promptResult === 'string') {
                        const json = await hookGetPromptResultById(promptResult);
                        setImageResult(json);
                        setGeneratedImageUrl(null);
                        return;
                      }
                      // If caller passed the full object, use it directly
                      setImageResult(promptResult as any);
                      setGeneratedImageUrl(null);
                    } catch (err: any) {
                      setGlobalError(err?.message ?? 'Unknown error');
                      // fallback to clearing generated image so user can try again
                      setGeneratedImageUrl(null);
                    }
                  }}
                />
              ) : generating ? (
                <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <CircularProgress size={24} />
                  <Box sx={{ color: 'text.secondary' }}>{'Generating image\u2026'}</Box>
                </Paper>
                ) : (
                <PromptResult imageResult={imageResult} onEvaluate={onEvaluate} onReset={handleReset} onGenerate={onGenerate} generating={generating} conversationId={conversationId} setConversationId={hookSetConversationId} />
              )
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Prompt;
