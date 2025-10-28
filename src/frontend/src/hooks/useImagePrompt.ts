import { useState } from 'react';
import { ImagePromptResponse, ImagePromptRevisionRequest, ImagePromptRevisionResponse, ImagePromptGenerateRequest } from './useImagePrompt.types';
import { ImageResponse } from './useImage.types';

export const useImagePrompt = () => {
  const [sending, setSending] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const base = (import.meta as any).env.VITE_BACKEND_URL || '';

  const sendPrompt = async (request: ImagePromptGenerateRequest, conversationId?: string | null): Promise<ImagePromptResponse> => {
    setSending(true);
    try {
      const payload: any = { prompt: request.prompt };
      if (conversationId) payload.conversationId = conversationId;
      const res = await fetch(`${base}/imagePrompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }
      // parse as typed JSON response
      const promptResultRaw = (await res.json()) as ImagePromptResponse | null;
      if (!promptResultRaw) throw new Error('Empty or invalid JSON response from server');

  if (!promptResultRaw.tags) promptResultRaw.tags = { included: [], notIncluded: [] } as any;
      return promptResultRaw;
    } finally {
      setSending(false);
    }
  };

  const evaluatePrompt = async (payload: ImagePromptRevisionRequest): Promise<ImagePromptRevisionResponse> => {
    setEvaluating(true);
    try {
      const res = await fetch(`${base}/imagePrompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

  const json = (await res.json()) as ImagePromptRevisionResponse & any;
  return json;
    } finally {
      setEvaluating(false);
    }
  };

  const generateImage = async (imagePromptId: string) => {
    setGenerating(true);
    try {
      // backend expects { ImagePromptId: string }
      const res = await fetch(`${base}/imagePrompt/${imagePromptId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const json = (await res.json()) as ImageResponse;
      return json;
    } finally {
      setGenerating(false);
    }
  };

  const getImagePromptById = async (id: string): Promise<ImagePromptResponse> => {
    if (!id) throw new Error('Missing id');
    const response = await fetch(`${base}/imagePrompt/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || `Request failed: ${response.status}`);
    }

    // parse as typed JSON and ensure tags default
    const promptResultRaw = (await response.json()) as ImagePromptResponse | null;
    if (!promptResultRaw) throw new Error('Empty or invalid JSON response from server');

    // ensure tags are present (match server shape expectations)
    if (!promptResultRaw.tags) promptResultRaw.tags = { included: [], notIncluded: [] } as any;

    return promptResultRaw;
  };

  return {
    sendPrompt,
    evaluatePrompt,
    generateImage,
    sending,
    evaluating,
    generating,
    getImagePromptById,
  };
};

export default useImagePrompt;
