import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import PageSelector from '../../components/PageSelector';
import PromptResult from '../../components/PromptResult/PromptResult';
import useImagePrompt from '../../hooks/useImagePrompt';
import { ImagePromptResponse, ImagePromptRevisionRequest } from '../../hooks/useImagePrompt.types';

const PromptPage: React.FC = () => {
  const { imagePromptId } = useParams();
  const { getImagePromptById, evaluatePrompt, sendPrompt } = useImagePrompt();
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageResult, setImageResult] = React.useState<ImagePromptResponse | null>(null);
  const [generateEnabled, setGenerateEnabled] = React.useState<boolean>(false);
  const [disableRewrite, setDisableRewrite] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchPrompt = async () => {
      if (!imagePromptId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getImagePromptById(imagePromptId);
        if (mounted) setImageResult(res);
        if (mounted) setConversationId(res.conversationId ?? null);
          if (mounted) {
            // Loaded prompt should default to disabling rewrite (read-only) and allow generate
            setDisableRewrite(true);
            setGenerateEnabled(true);
          }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to fetch prompt');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrompt();
    return () => { mounted = false; };
    // Intentionally only depend on imagePromptId. `getImagePromptById` is a function
    // returned from the hook and may have a changing identity between renders which
    // would cause this effect to re-run repeatedly. We want to fetch only when the
    // id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePromptId]);

  const handleEvaluate = React.useCallback(async (payload: ImagePromptRevisionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const rev = await evaluatePrompt(payload);
      const sent = await sendPrompt({ prompt: (rev as any).revisedPrompt }, conversationId ?? undefined);
      setConversationId(sent?.conversationId ?? conversationId ?? null);
      setImageResult(sent ?? null);
      // After successful evaluate+send: disable rewrite by default and enable generate
      setDisableRewrite(true);
      setGenerateEnabled(true);
      return sent;
    } catch (err: any) {
      setError(err?.message ?? 'Evaluation/send failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [evaluatePrompt, sendPrompt, conversationId]);

  return (
    <Container maxWidth={'lg'} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 } }}>
      <PageSelector initial="create" />

      <Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {imageResult && (
          <PromptResult
            imageResult={imageResult}
            disableRewrite={disableRewrite}
            generateEnabled={generateEnabled}
            onEvaluate={handleEvaluate}
          />
        )}
      </Box>
    </Container>
  );
};

export default PromptPage;
