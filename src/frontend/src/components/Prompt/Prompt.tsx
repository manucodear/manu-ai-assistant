import React from 'react';
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
import { ImagePromptResponse } from '../../hooks/useImagePrompt.types';
import { usePromptController } from './usePromptController';

export const Prompt: React.FC<PromptProps> = ({ value, controller }: PromptProps) => {
  // use external controller if provided, otherwise create an internal one
  const internalController = usePromptController({ value });
  const ctrl = controller ?? internalController;

  const {
    state: {
      activeTab,
      isShowingPromptResult,
      input,
      globalError,
      evaluateMessage,
      evaluateSeverity,
      generatedImageUrl,
      generateEnabled,
      selectedImageForGeneration,
      openedFromGallery,
      sending: hookSending,
      evaluating: hookEvaluating,
      generating: hookGenerating,
    },
    actions,
  } = ctrl;

  const disable = hookSending;
  const evaluating = hookEvaluating;
  const generating = hookGenerating;

  // Memoize construction of the image object passed to ImageDisplay to avoid
  // duplicating the same object shape in multiple places below.
  const imageForDisplay = React.useMemo(() => {
    const hasPrompt = !!selectedImageForGeneration?.imagePrompt;
    const url = selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '';

    if (hasPrompt) {
      return {
        id: selectedImageForGeneration?.imagePrompt?.id ?? (selectedImageForGeneration?.imagePromptId ?? ''),
        timestamp: '',
        imageData: {
          url,
          smallUrl: url,
          mediumUrl: url,
          largeUrl: url,
        },
        imagePrompt: selectedImageForGeneration?.imagePrompt as ImagePromptResponse,
      };
    }

    return {
      id: selectedImageForGeneration?.imagePromptId ?? '',
      timestamp: '',
      imageData: {
        url,
        smallUrl: url,
        mediumUrl: url,
        largeUrl: url,
      },
      imagePrompt: (selectedImageForGeneration?.imagePrompt as ImagePromptResponse) ?? ({} as ImagePromptResponse),
    };
  }, [generatedImageUrl, selectedImageForGeneration]);
  // conversationId removed from hook; not tracked here
  // result UI is self-contained

  // Handler invoked by the PromptInput when the user sends a prompt
  // Now accepts prompt and conversationId (conversationId is not used by the hook)
  // Gallery overlay will pass back a full ImagePromptResponse when selecting an item

  const handleSendClick = actions.sendPrompt;


  // Called by PromptResult when the user clicks "ReWrite" to evaluate the prompt
  const onEvaluate = actions.evaluate;

  const handleGalleryShowPromptResult = actions.showGalleryPrompt;

  // onGenerate: called by PromptResult when user triggers Generate
  const onGenerate = actions.generate;

  // Centralized handler used by ImageDisplay to show the prompt result directly
  // Now accepts the ImagePromptResponse and displays the PromptResult in create mode
  const handleImageDisplayShowPromptResult = actions.showImageDisplayPrompt;

  const handleReset = actions.reset;

  // When the ImageDisplay triggers a reset, we want to return the UI to the gallery view
  const handleResetShowGallery = actions.resetShowGallery;

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
            actions.setActiveTab?.('generate');
            actions.setIsShowingPromptResult?.(false);
            actions.setOpenedFromGallery?.(false);
            // clear any gallery-related state so the gallery starts fresh next time
              actions.setSelectedImageForGeneration?.(null);
            actions.setGeneratedImageUrl?.(null);
          }}
          onShowGallery={() => {
            actions.setActiveTab?.('gallery');
            actions.setIsShowingPromptResult?.(false);
            // clear any existing result so the gallery view is clean
            actions.setGeneratedImageUrl?.(null);
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
        {openedFromGallery && isShowingPromptResult && (generatedImageUrl || selectedImageForGeneration?.imageUrl || selectedImageForGeneration?.imagePrompt) && (
          <ImageDisplay
            image={
              // imageForDisplay is memoized below; placeholder here to satisfy JSX position
              (() => {
                // this will be replaced by the memoized value further down in the render
                return {
                  id: selectedImageForGeneration?.imagePrompt?.id ?? (selectedImageForGeneration?.imagePromptId ?? ''),
                  timestamp: '',
                  imageData: {
                    url: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                    smallUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                    mediumUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                    largeUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                  },
                  imagePrompt: selectedImageForGeneration?.imagePrompt as ImagePromptResponse,
                };
              })()
            }
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
            {!disable && !evaluating ? (
              <PromptInput input={input} setInput={actions.setInput} onSend={handleSendClick} disable={disable} />
            ) : disable || evaluating ? (
              <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Box sx={{ color: 'text.secondary' }}>{evaluating ? 'Evaluating\u2026' : 'Waiting for response\u2026'}</Box>
              </Paper>
            ) : (selectedImageForGeneration?.imagePrompt) || generatedImageUrl || selectedImageForGeneration ? (
              // If we have a generated image URL or a gallery-selected imageUrl, show the ImageDisplay view.
              // Otherwise show prompt result or generation/loading states.
              (generatedImageUrl || selectedImageForGeneration?.imageUrl) ? (
                <ImageDisplay
                  image={imageForDisplay}
                  onReset={handleResetShowGallery}
                  onShowPromptResult={handleImageDisplayShowPromptResult}
                />
              ) : generating ? (
                <Paper aria-live="polite" elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <CircularProgress size={24} />
                  <Box sx={{ color: 'text.secondary' }}>{'Generating image\u2026'}</Box>
                </Paper>
              ) : (
                <PromptResult
                  imageResult={selectedImageForGeneration?.imagePrompt as ImagePromptResponse}
                  onEvaluate={onEvaluate}
                  onReset={handleReset}
                  onGenerate={onGenerate}
                  generating={generating}
                  generateEnabled={generateEnabled}
                />
              )
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
};