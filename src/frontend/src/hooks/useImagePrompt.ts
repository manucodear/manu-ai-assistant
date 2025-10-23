import { useState } from 'react';
import { ImagePromptResult } from '../components/Prompt/Prompt.types';

export const useImagePrompt = () => {
  const [sending, setSending] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const base = (import.meta as any).env.VITE_BACKEND_URL || '';

  const sendPrompt = async (text: string) => {
    if (!text || !text.trim()) throw new Error('Empty prompt');
    setSending(true);
    try {
      const payload = { prompt: text, conversationId: conversationId ?? '' } as any;
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

      const raw = await res.text();
      let parsed: any = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (e) {
        parsed = null;
      }

      if (!parsed) throw new Error('Empty or invalid JSON response from server');

      const promptResultRaw: any = parsed || {};
      if (promptResultRaw.conversationId) setConversationId(String(promptResultRaw.conversationId));

      const tags = promptResultRaw.tags || {};
      const data: ImagePromptResult = {
        id: promptResultRaw.id ?? '',
        originalPrompt: promptResultRaw.originalPrompt ?? '',
        improvedPrompt: promptResultRaw.improvedPrompt ?? '',
        mainDifferences: promptResultRaw.mainDifferences ?? '',
        tags: { included: tags.included ?? [], notIncluded: tags.notIncluded ?? [] },
        pointOfViews: promptResultRaw.pointOfViews ?? [],
        imageStyles: promptResultRaw.imageStyles ?? [],
        imageStyleRaw: promptResultRaw.imageStyle ?? null,
        imageStyle: (promptResultRaw.hasOwnProperty('imageStyle') && promptResultRaw.imageStyle && String(promptResultRaw.imageStyle).trim()) ? String(promptResultRaw.imageStyle).trim() : (promptResultRaw.imageStyles && promptResultRaw.imageStyles[0]) ?? null,
        pointOfViewRaw: promptResultRaw.pointOfView ?? null,
        conversationId: String(promptResultRaw.conversationId ?? ''),
      };

      return data;
    } finally {
      setSending(false);
    }
  };

  const evaluatePrompt = async (payload: any) => {
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

      const json = await res.json();
      if (json && json.conversationId) setConversationId(String(json.conversationId));
      return json;
    } finally {
      setEvaluating(false);
    }
  };

  const generateImage = async (result: ImagePromptResult) => {
    setGenerating(true);
    try {
      const res = await fetch(`${base}/Image/Generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imagePrompt: result }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const json = await res.json();
      const url = json?.image?.url ?? null;
      if (!url) throw new Error('No image URL returned');
      return url;
    } finally {
      setGenerating(false);
    }
  };

  const getPromptResultById = async (id: string) => {
    if (!id) throw new Error('Missing id');
  const base = (import.meta as any).env.VITE_BACKEND_URL || '';
    const response = await fetch(`${base}/imagePrompt/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || `Request failed: ${response.status}`);
    }
    const json = await response.json();
    return json;
  };

  return {
    sendPrompt,
    evaluatePrompt,
    generateImage,
    sending,
    evaluating,
    generating,
    conversationId,
    setConversationId,
    getPromptResultById,
  };
};

export default useImagePrompt;
