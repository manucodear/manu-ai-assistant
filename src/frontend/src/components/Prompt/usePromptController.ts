import { useState, useCallback } from 'react';
import useImagePrompt from '../../hooks/useImagePrompt';
import {
  ImagePromptResponse,
  ImagePromptRevisionRequest,
  ImagePromptRevisionResponse,
} from '../../hooks/useImagePrompt.types';
import { ImageResponse } from '../../hooks/useImage.types';

export type ActiveTab = 'generate' | 'gallery';

export const usePromptController = (initial?: { value?: string }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [isShowingPromptResult, setIsShowingPromptResult] = useState<boolean>(false);
  const [input, setInput] = useState<string>(initial?.value ?? '');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [evaluateMessage, setEvaluateMessage] = useState<string | null>(null);
  const [evaluateSeverity, setEvaluateSeverity] = useState<'success' | 'error' | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generateEnabled, setGenerateEnabled] = useState<boolean>(false);
  const [selectedImageForGeneration, setSelectedImageForGeneration] = useState<{
    imageUrl?: string;
    imagePromptId?: string | null;
    imagePrompt?: ImagePromptResponse | null;
  } | null>(null);
  const [openedFromGallery, setOpenedFromGallery] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const {
    sendPrompt: hookSendPrompt,
    evaluatePrompt: hookEvaluatePrompt,
    generateImage: hookGenerateImage,
    sending: hookSending,
    evaluating: hookEvaluating,
    generating: hookGenerating,
  } = useImagePrompt();

  const sendPrompt = useCallback(
    async (text: string, _conversationId: string | null = null) => {
      if (!text || !text.trim()) return null;
      setEvaluateMessage(null);
      setEvaluateSeverity(null);
      setGlobalError(null);
      setGeneratedImageUrl(null);
      const previousInput = text;
      setInput('');
      try {
        const data = await hookSendPrompt({ prompt: text });
        setConversationId(data?.conversationId ?? null);
        setSelectedImageForGeneration({ imageUrl: undefined, imagePromptId: data?.id ?? null, imagePrompt: data });
        setIsShowingPromptResult(Boolean(data));
        setGeneratedImageUrl(null);
        setGenerateEnabled(true);
        setActiveTab('generate');
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
        setEvaluateMessage(msg);
        setEvaluateSeverity('error');
        setInput(previousInput);
        throw err;
      }
    },
    [hookSendPrompt]
  );

  const evaluate = useCallback(
    async (payload: ImagePromptRevisionRequest) => {
      setGlobalError(null);
      try {
        const rev = (await hookEvaluatePrompt(payload)) as ImagePromptRevisionResponse;
        const imageResult = await hookSendPrompt({ prompt: rev.revisedPrompt }, conversationId ?? null);
        setConversationId(imageResult?.conversationId ?? conversationId ?? null);
        setSelectedImageForGeneration((s) => ({ ...(s ?? {}), imagePromptId: imageResult?.id ?? s?.imagePromptId ?? null, imagePrompt: imageResult }));
        setIsShowingPromptResult(true);
        setGenerateEnabled(true);
        return imageResult;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
        setGlobalError(msg);
        throw err;
      }
    },
    [hookEvaluatePrompt, hookSendPrompt, conversationId]
  );

  const generate = useCallback(
    async (imagePromptId: string) => {
      setGlobalError(null);
      setGeneratedImageUrl(null);
      try {
        const image = await hookGenerateImage(imagePromptId);
        const url = image?.imageData?.url ?? null;
        setGeneratedImageUrl(url);
        setGenerateEnabled(false);
        return image;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error');
        setGlobalError(msg);
        throw err;
      }
    },
    [hookGenerateImage]
  );

  const showGalleryPrompt = useCallback((result: ImageResponse) => {
    setSelectedImageForGeneration({ imageUrl: result.imageData?.url ?? '', imagePromptId: result.imagePrompt?.id ?? null, imagePrompt: result.imagePrompt ?? null });
    setIsShowingPromptResult(true);
    setOpenedFromGallery(true);
    setGenerateEnabled(false);
  }, []);

  const showImageDisplayPrompt = useCallback((imagePrompt: ImagePromptResponse) => {
    setSelectedImageForGeneration({ imageUrl: undefined, imagePromptId: imagePrompt?.id ?? null, imagePrompt });
    setGeneratedImageUrl(null);
    setActiveTab('generate');
    setIsShowingPromptResult(true);
    setOpenedFromGallery(false);
    setGenerateEnabled(false);
  }, []);

  const reset = useCallback(() => {
    setSelectedImageForGeneration(null);
    setInput('');
    setGlobalError(null);
    setEvaluateMessage(null);
    setEvaluateSeverity(null);
    setGeneratedImageUrl(null);
    setConversationId(null);
    setGenerateEnabled(true);
  }, []);

  const resetShowGallery = useCallback(() => {
    if (openedFromGallery) {
      setOpenedFromGallery(false);
      setIsShowingPromptResult(false);
      setGeneratedImageUrl(null);
      setSelectedImageForGeneration(null);
      setActiveTab('gallery');
      return;
    }
    reset();
    setActiveTab('gallery');
    setIsShowingPromptResult(false);
    setGeneratedImageUrl(null);
  }, [openedFromGallery, reset]);

  return {
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
      conversationId,
      sending: hookSending,
      evaluating: hookEvaluating,
      generating: hookGenerating,
    },
    actions: {
      setActiveTab,
      setIsShowingPromptResult,
      setOpenedFromGallery,
      setSelectedImageForGeneration,
      setGeneratedImageUrl,
      setInput,
      sendPrompt,
      evaluate,
      generate,
      showGalleryPrompt,
      showImageDisplayPrompt,
      reset,
      resetShowGallery,
      setGenerateEnabled,
      setGlobalError,
      setEvaluateMessage,
      setEvaluateSeverity,
    },
  } as const;
};

export type PromptController = ReturnType<typeof usePromptController>;
