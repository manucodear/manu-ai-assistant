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
import { ImagePromptResponse, ImagePromptRevisionRequest, ImagePromptRevisionResponse } from '../../hooks/useImagePrompt.types';
import { ImageResponse } from '../../hooks/useImage.types';

export const Prompt: React.FC<PromptProps> = ({ value }: PromptProps) => {
  // Prompt now owns its own UI state: active tab (generate/gallery) and whether a prompt result view is showing
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
  const [isShowingPromptResult, setIsShowingPromptResult] = useState<boolean>(false);
  const [input, setInput] = useState<string>(value ?? '');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [evaluateMessage, setEvaluateMessage] = useState<string | null>(null);
  const [evaluateSeverity, setEvaluateSeverity] = useState<'success' | 'error' | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  // Controls whether the Generate button in PromptResult is enabled. Prompt owns this state.
  const [generateEnabled, setGenerateEnabled] = useState<boolean>(false);
  // store the selected image and optionally the prompt object together
  const [selectedImageForGeneration, setSelectedImageForGeneration] = useState<{ imageUrl?: string; imagePromptId?: string | null; imagePrompt?: ImagePromptResponse | null } | null>(null);
  const [openedFromGallery, setOpenedFromGallery] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const {
    sendPrompt: hookSendPrompt,
    evaluatePrompt: hookEvaluatePrompt,
    generateImage: hookGenerateImage,
    sending: hookSending,
    evaluating: hookEvaluating,
    generating: hookGenerating,
    // getImagePromptById removed — gallery/display now provides full ImageResponse
  } = useImagePrompt();

  const disable = hookSending;
  const evaluating = hookEvaluating;
  const generating = hookGenerating;
  // conversationId removed from hook; not tracked here
  // result UI is self-contained

  // Handler invoked by the PromptInput when the user sends a prompt
  // Now accepts prompt and conversationId (conversationId is not used by the hook)
  // Gallery overlay will pass back a full ImagePromptResponse when selecting an item

  const handleSendClick = async (text: string, _conversationId: string | null) => {
    if (!text || !text.trim()) return;
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setGlobalError(null);
    setGeneratedImageUrl(null);
    const previousInput = text;
    setInput('');
    try {
      // hookSendPrompt expects ImagePromptGenerateRequest { prompt }
      const data = await hookSendPrompt({ prompt: text });
      // hookSendPrompt returns ImagePromptResponse
      // capture conversationId if present so we can include it on subsequent evaluate/send
      setConversationId(data?.conversationId ?? null);
      // store the prompt object on the selectedImageForGeneration so children receive it via props
      setSelectedImageForGeneration({ imageUrl: undefined, imagePromptId: data?.id ?? null, imagePrompt: data });
  setIsShowingPromptResult(Boolean(data));
  setGeneratedImageUrl(null);
  // New prompt resets generateEnabled — require explicit reset or evaluate to enable
  setGenerateEnabled(false);
      setActiveTab('generate');
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
      setEvaluateMessage(msg);
      setEvaluateSeverity('error');
      // Only set the evaluation message/severity here to avoid showing
      // the same error twice (globalError renders a separate Alert).
      // restore input so user can retry
      setInput(previousInput);
      throw err;
    }
  };


  // Called by PromptResult when the user clicks "ReWrite" to evaluate the prompt
  const onEvaluate = async (payload: ImagePromptRevisionRequest) => {
    setGlobalError(null);
    try {
      const rev = (await hookEvaluatePrompt(payload)) as ImagePromptRevisionResponse;
      // rev.revisedPrompt contains the revised prompt string — use it to request a full ImagePromptResponse
      const imageResult = await hookSendPrompt({ prompt: rev.revisedPrompt }, conversationId ?? null);
      // update conversationId if the server returned one
      setConversationId(imageResult?.conversationId ?? conversationId ?? null);
      // attach the new prompt result to the selected image holder
      setSelectedImageForGeneration((s) => ({ ...(s ?? {}), imagePromptId: imageResult?.id ?? s?.imagePromptId ?? null, imagePrompt: imageResult }));
  setIsShowingPromptResult(true);
  // after successful evaluate, enable generate
  setGenerateEnabled(true);
      return imageResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
      setGlobalError(msg);
      throw err;
    }
  };

  const handleGalleryShowPromptResult = async (result: ImageResponse) => {
    // The gallery passes the full ImageResponse; extract prompt and image info
    // store the selected image and its prompt object so child components can receive it as a parameter
    setSelectedImageForGeneration({ imageUrl: result.imageData?.url ?? '', imagePromptId: result.imagePrompt?.id ?? null, imagePrompt: result.imagePrompt ?? null });
    setIsShowingPromptResult(true);
    setOpenedFromGallery(true);
    // opening image display from gallery disables generate
    setGenerateEnabled(false);
  };

  // onGenerate: called by PromptResult when user triggers Generate
  const onGenerate = async (imagePromptId: string) => {
    setGlobalError(null);
    setGeneratedImageUrl(null);
    try {
      const image = await hookGenerateImage(imagePromptId);
      const url = image?.imageData?.url ?? null;
      setGeneratedImageUrl(url);
      // showing generated image disables generate until reset
      setGenerateEnabled(false);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
      setGlobalError(msg);
    }
  };

  // Centralized handler used by ImageDisplay to show the prompt result directly
  // Now accepts the ImagePromptResponse and displays the PromptResult in create mode
  const handleImageDisplayShowPromptResult = (imagePrompt: ImagePromptResponse) => {
    // Show the prompt result and switch to the create view
    // Show the prompt result and switch to the create view
    setSelectedImageForGeneration({ imageUrl: undefined, imagePromptId: imagePrompt?.id ?? null, imagePrompt });
    setGeneratedImageUrl(null);
    setActiveTab('generate');
    setIsShowingPromptResult(true);
    setOpenedFromGallery(false);
    // showing prompt result from image display disables generate
    setGenerateEnabled(false);
  };

  const handleReset = () => {
    // Reset to initial state: clear result and input, clear messages and errors
    setSelectedImageForGeneration(null);
    setInput('');
    setGlobalError(null);
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    // clear generation state as well
    // Note: sending/evaluating/generating flags are managed by the hook; we cannot directly set them here.
    setGeneratedImageUrl(null);
    setConversationId(null);
  // Reset enables generate per spec
  setGenerateEnabled(true);
    // conversation tracking removed from this component
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
      setGeneratedImageUrl(null);
      setSelectedImageForGeneration(null);
      // keep activeTab as 'gallery' so the gallery remains available and not remounted
      setActiveTab('gallery');
      return;
    }

    // Otherwise perform the usual reset and switch to the gallery view
    handleReset();
    setActiveTab('gallery');
    setIsShowingPromptResult(false);
    setGeneratedImageUrl(null);
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
            setSelectedImageForGeneration(null);
            setSelectedImageForGeneration(null);
            setGeneratedImageUrl(null);
          }}
          onShowGallery={() => {
            setActiveTab('gallery');
            setIsShowingPromptResult(false);
            // clear any existing result so the gallery view is clean
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
        {openedFromGallery && isShowingPromptResult && (generatedImageUrl || selectedImageForGeneration?.imageUrl || selectedImageForGeneration?.imagePrompt) && (
          <ImageDisplay
            image={
              selectedImageForGeneration?.imagePrompt
                ? {
                    id: selectedImageForGeneration?.imagePrompt?.id ?? (selectedImageForGeneration?.imagePromptId ?? ''),
                    timestamp: '',
                    imageData: {
                      url: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                      smallUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                      mediumUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                      largeUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                    },
                    imagePrompt: selectedImageForGeneration?.imagePrompt as ImagePromptResponse,
                  }
                : {
                    id: selectedImageForGeneration?.imagePromptId ?? '',
                    timestamp: '',
                    imageData: {
                      url: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                      smallUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                      mediumUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                      largeUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                    },
                    imagePrompt: (selectedImageForGeneration?.imagePrompt as ImagePromptResponse) ?? ({} as ImagePromptResponse),
                  }
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
            {!disable && !(selectedImageForGeneration?.imagePrompt) && !evaluating ? (
              <PromptInput input={input} setInput={setInput} onSend={handleSendClick} disable={disable} />
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
                  image={
                    selectedImageForGeneration?.imagePrompt
                      ? {
                          id: selectedImageForGeneration?.imagePrompt?.id ?? (selectedImageForGeneration?.imagePromptId ?? ''),
                          timestamp: '',
                          imageData: {
                            url: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                            smallUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                            mediumUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                            largeUrl: selectedImageForGeneration?.imageUrl ?? generatedImageUrl ?? '',
                          },
                          imagePrompt: selectedImageForGeneration?.imagePrompt as ImagePromptResponse,
                        }
                      : {
                          id: selectedImageForGeneration?.imagePromptId ?? '',
                          timestamp: '',
                          imageData: {
                            url: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                            smallUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                            mediumUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                            largeUrl: generatedImageUrl ?? selectedImageForGeneration?.imageUrl ?? '',
                          },
                          imagePrompt: (selectedImageForGeneration?.imagePrompt as ImagePromptResponse) ?? ({} as ImagePromptResponse),
                        }
                  }
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