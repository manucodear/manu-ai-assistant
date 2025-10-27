import React, { useState } from 'react';
import { PromptProps } from './Prompt.types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
// input UI moved to PromptInput
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Paper/Stack removed — no historic messages UI
// result UI moved into PromptResult
import PromptInput from '../PromptInput/PromptInput';
import PromptResult from '../PromptResult/PromptResult';
import ImageDisplay from '../ImageDisplay/ImageDisplay';
import ImageGallery from '../ImageGallery/ImageGallery';
import ImageActionSelector from '../ImageActionSelector/ImageActionSelector';
import useImagePrompt from '../../hooks/useImagePrompt';
import { ImagePromptResponse } from '../../hooks/useImagePrompt.types';

export const Prompt: React.FC<PromptProps> = ({ value }: PromptProps) => {
  // Prompt now owns its own UI state: active tab (generate/gallery) and whether a prompt result view is showing
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
  const [isShowingPromptResult, setIsShowingPromptResult] = useState<boolean>(false);
  const [input, setInput] = useState<string>(value ?? '');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [evaluateMessage, setEvaluateMessage] = useState<string | null>(null);
  const [evaluateSeverity, setEvaluateSeverity] = useState<'success' | 'error' | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imagePromptResult, setImagePromptResult] = useState<ImagePromptResponse | null>(null);
  const [selectedImageForGeneration, setSelectedImageForGeneration] = useState<{ imageUrl?: string; imagePromptId?: string | null } | null>(null);
  const [openedFromGallery, setOpenedFromGallery] = useState<boolean>(false);
  const {
    sendPrompt: hookSendPrompt,
    evaluatePrompt: hookEvaluatePrompt,
    generateImage: hookGenerateImage,
    sending: hookSending,
    evaluating: hookEvaluating,
    generating: hookGenerating,
    conversationId: hookConversationId,
    setConversationId: hookSetConversationId,
    getImagePromptById: hookGetPromptResultById,
  } = useImagePrompt();

  const disable = hookSending;
  const evaluating = hookEvaluating;
  const generating = hookGenerating;
  const conversationId = hookConversationId;
  // result UI is self-contained

  // Handler invoked by the PromptInput when the user sends a prompt
  const handleSendClick = async (text: string) => {
    if (!text || !text.trim()) return;
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setGlobalError(null);
    setGeneratedImageUrl(null);
    const previousInput = text;
    setInput('');
    try {
      const data = await hookSendPrompt(text);
      // hookSendPrompt returns an ImagePromptResult-like object
      setImagePromptResult(data as any);
      setIsShowingPromptResult(Boolean(data));
      setSelectedImageForGeneration(null);
      setGeneratedImageUrl(null);
      setActiveTab('generate');
      return data;
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      setEvaluateMessage(msg);
      setEvaluateSeverity('error');
      // Only set the evaluation message/severity here to avoid showing
      // the same error twice (globalError renders a separate Alert).
      // restore input so user can retry
      setInput(previousInput);
      throw err;
    }
  };

  // Wrapper for PromptInput which expects a zero-arg onSend handler
  const handleSendClickNoArgs = () => {
    // fire-and-forget; any errors are handled inside handleSendClick
    void handleSendClick(input);
  };

  // Called by PromptResult when the user clicks "ReWrite" to evaluate the prompt
  const onEvaluate = async (payload: any) => {
    setGlobalError(null);
    try {
      const json = await hookEvaluatePrompt(payload);
      if (json && json.conversationId && hookSetConversationId) hookSetConversationId(String(json.conversationId));
      setImagePromptResult(json as any);
      setIsShowingPromptResult(true);
      return json;
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
      throw err;
    }
  };

  const handleGalleryShowPromptResult = async (result: any) => {
    try {
      if (!result) {
        // No id => gallery is requesting the prompt input view
        setIsShowingPromptResult(false);
        setSelectedImageForGeneration(null);
        setOpenedFromGallery(false);
        return;
      }
      // If the gallery passed an id string, fetch the prompt result via the hook
      if (typeof result === 'string') {
        const json = await hookGetPromptResultById(result);
        setImagePromptResult(json);
        setSelectedImageForGeneration(null);
        setIsShowingPromptResult(Boolean(json));
        // Mark that this overlay was opened from the gallery so we don't unmount it
        setOpenedFromGallery(true);
        return;
      }

      // If the gallery passed an object { imageUrl, imagePromptId }
      if (typeof result === 'object' && result !== null) {
        const payload = result as { imageUrl?: string; imagePromptId?: string | null };
        setSelectedImageForGeneration({ imageUrl: payload.imageUrl, imagePromptId: payload.imagePromptId ?? null });
        // If there's an imagePromptId, fetch the prompt result so ImageDisplay can use it
        if (payload.imagePromptId) {
          try {
            const json = await hookGetPromptResultById(payload.imagePromptId);
            setImagePromptResult(json);
          } catch (err: any) {
            // ignore fetch error here, show generation UI nonetheless
            setImagePromptResult(null);
            setGlobalError(err?.message ?? 'Failed to load prompt result');
          }
        } else {
          setImagePromptResult(null);
        }
        setIsShowingPromptResult(true);
        // Keep the gallery mounted and mark overlay as opened from gallery so we avoid reloading it
        setOpenedFromGallery(true);
        return;
      }

      // Fallback: treat as full prompt object
      setImagePromptResult(result as any);
      setIsShowingPromptResult(true);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
      setIsShowingPromptResult(true);
    }
  };

  // onGenerate: called by PromptResult when user triggers Generate
  const onGenerate = async (imagePromptId: string) => {
    setGlobalError(null);
    setGeneratedImageUrl(null);
    try {
      const image = await hookGenerateImage(imagePromptId);
      const url = image?.imageData?.url ?? null;
      setGeneratedImageUrl(url);
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
    }
  };

  // Centralized handler used by ImageDisplay to ask Prompt to show a prompt result
  // Now expects an imagePromptId string and fetches the ImagePromptResult via the hook
  const handleImageDisplayShowPromptResult = async (imagePromptId: string | null) => {
    try {
      if (!imagePromptId) {
        // No id provided -> treat as reset
        handleReset();
        return;
      }

      const json = await hookGetPromptResultById(imagePromptId);
      setImagePromptResult(json);
      setGeneratedImageUrl(null);
      setSelectedImageForGeneration(null);
      setIsShowingPromptResult(Boolean(json));
    } catch (err: any) {
      setGlobalError(err?.message ?? 'Unknown error');
      setGeneratedImageUrl(null);
      setSelectedImageForGeneration(null);
    }
  };

  const handleReset = () => {
    // Reset to initial state: clear result and input, clear messages and errors
    setImagePromptResult(null);
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

  // When the ImageDisplay triggers a reset, we want to return the UI to the gallery view
  const handleResetShowGallery = () => {
    // If the overlay was opened from the gallery, simply close the overlay but keep the gallery mounted
    if (openedFromGallery) {
      setOpenedFromGallery(false);
      setIsShowingPromptResult(false);
      setSelectedImageForGeneration(null);
      setGeneratedImageUrl(null);
      setImagePromptResult(null);
      // keep activeTab as 'gallery' so the gallery remains available and not remounted
      setActiveTab('gallery');
      return;
    }

    // Otherwise perform the usual reset and switch to the gallery view
    handleReset();
    setActiveTab('gallery');
    setIsShowingPromptResult(false);
    setSelectedImageForGeneration(null);
    setGeneratedImageUrl(null);
    setImagePromptResult(null);
  };

  // key handling moved into PromptInput; keep sendPrompt available for direct calls

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', flex: 1 }}>
      <Box sx={{ width: '100%', maxWidth: { xs: 980, md: '100%' }, mx: { xs: 'auto', md: 0 }, px: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Image action selector (Create / Gallery) — Prompt controls the actions internally */}
        <ImageActionSelector
          activeTab={activeTab}
          isShowingPromptResult={isShowingPromptResult}
          onShowGenerate={() => {
            // Switch to create view: unmount gallery so it will be recreated
            // (and refetch) the next time the user opens it.
            setActiveTab('generate');
            setIsShowingPromptResult(false);
            setOpenedFromGallery(false);
            // clear any gallery-related state so the gallery starts fresh next time
            setImagePromptResult(null);
            setSelectedImageForGeneration(null);
            setGeneratedImageUrl(null);
          }}
          onShowGallery={() => {
            setActiveTab('gallery');
            setIsShowingPromptResult(false);
            // clear any existing result so the gallery view is clean
            setImagePromptResult(null);
            setGeneratedImageUrl(null);
          }}
        />
        {/* Include the ImageGallery inside the Prompt layout. Keep it mounted but hide when ImageDisplay overlay is open
            to avoid reloading images when the user opens an image from the gallery. */}
        {/* Render Gallery only when the gallery tab is active and we are not showing
            an overlay opened from the gallery; unmounting the gallery when switching
            away ensures it refetches when shown again. */}
        {activeTab === 'gallery' && !(openedFromGallery && isShowingPromptResult) && (
          <Box sx={{ width: '100%' }}>
            <ImageGallery onShowPromptResult={handleGalleryShowPromptResult} />
          </Box>
        )}

        {/* If the overlay was opened from the gallery, show the full-image overlay while keeping the gallery mounted (hidden).
            This ensures the gallery isn't reloaded when the overlay closes. */}
        {openedFromGallery && isShowingPromptResult && (generatedImageUrl || selectedImageForGeneration?.imageUrl || imagePromptResult) && (
          <ImageDisplay
            imageUrl={selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? ''}
            imagePromptId={selectedImageForGeneration?.imagePromptId ?? imagePromptResult?.id}
            onReset={handleResetShowGallery}
            onShowPromptResult={handleImageDisplayShowPromptResult}
          />
        )}

        {/* When in generate tab, show alerts and input/result. Gallery is exclusive unless overlay openedFromGallery. */}
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
            {!disable && !imagePromptResult && !evaluating ? (
              <PromptInput input={input} setInput={setInput} onSend={handleSendClickNoArgs} disable={disable} />
            ) : disable || evaluating ? (
              <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Box sx={{ color: 'text.secondary' }}>{evaluating ? 'Evaluating\u2026' : 'Waiting for response\u2026'}</Box>
              </Paper>
            ) : imagePromptResult || generatedImageUrl || selectedImageForGeneration ? (
              // If we have a generated image URL or a gallery-selected imageUrl, show the ImageDisplay view.
              // Otherwise show prompt result or generation/loading states.
              (generatedImageUrl || selectedImageForGeneration?.imageUrl) ? (
                <ImageDisplay
                  imageUrl={selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? ''}
                  imagePromptId={selectedImageForGeneration?.imagePromptId ?? imagePromptResult?.id}
                  onReset={handleResetShowGallery}
                  onShowPromptResult={handleImageDisplayShowPromptResult}
                />
              ) : generating ? (
                <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <CircularProgress size={24} />
                  <Box sx={{ color: 'text.secondary' }}>{'Generating image\u2026'}</Box>
                </Paper>
              ) : (
                <PromptResult imageResult={imagePromptResult as any} onEvaluate={onEvaluate} onReset={handleReset} onGenerate={onGenerate} generating={generating} conversationId={conversationId} setConversationId={hookSetConversationId} />
              )
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
};