import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Alert } from '@mui/material';
import PageSelector from '../../components/PageSelector';
import PromptInput from '../../components/PromptInput/PromptInput';
import PromptResult from '../../components/PromptResult/PromptResult';
import PromptInputSkeleton from '../../components/PromptInputSkeleton';
import PromptResultSkeleton from '../../components/PromptResultSkeleton';
import ImageDisplaySkeleton from '../../components/ImageDisplaySkeleton';
import PromptAttachImage from '../../components/PromptAttachImage';
import ImageDisplay from '../../components/ImageDisplay/ImageDisplay';
import useImagePrompt from '../../hooks/useImagePrompt';
import { ImagePromptResponse, ImagePromptGenerateRequest } from '../../hooks/useImagePrompt.types';
import { ImageDataResponse, ImageResponse } from '../../hooks/useImage.types';
//import { ImageResponse } from '../../hooks/useImage.types';

const Create: React.FC = () => {
    const { imagePromptId } = useParams();
    const navigate = useNavigate();
    const [input, setInput] = React.useState<string>('');
    const [promptResult, setPromptResult] = React.useState<ImagePromptResponse | null>(null);
    const [uploadedImage, setUploadedImage] = React.useState<ImageDataResponse | null>(null); // Store uploaded image data
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = React.useState<ImageResponse | null>(null);
    const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
    const { sendPrompt, getImagePromptById, evaluatePrompt, generateImage } = useImagePrompt();
    const disableAttachImage = true;

    // Load image prompt data when imagePromptId is present in URL
    const location = useLocation();
    const skipLocationHydrateRef = React.useRef(false);

    React.useEffect(() => {
        let mounted = true;
        const fetchPrompt = async () => {
            if (!imagePromptId) return;

            // If the navigation included the prompt in location.state (we passed it after POST),
            // use that and skip the GET. This prevents a race where navigate() updates the URL
            // before React state (setPromptResult) is visible to the effect.
            // However, when we've just reset the UI we want to prevent rehydration from
            // location.state for one run — skipLocationHydrateRef marks that case.
            if (skipLocationHydrateRef.current) {
                skipLocationHydrateRef.current = false;
                return;
            } else {
                const navPrompt = (location.state as any)?.prompt as ImagePromptResponse | undefined;
                if (navPrompt && navPrompt.id === imagePromptId) {
                    if (mounted) setPromptResult(navPrompt);
                    return;
                }
            }

            // If we already have the promptResult for the same id in component state, skip the GET.
            if (promptResult && promptResult.id === imagePromptId) {
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const res = await getImagePromptById(imagePromptId);
                if (mounted) {
                    setPromptResult(res);
                }
            } catch (err: any) {
                if (mounted) setError(err?.message ?? 'Failed to fetch prompt');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPrompt();
        return () => { mounted = false; };
    }, [imagePromptId, promptResult?.id]);

    // monitoring/debug removed

    const handleSend = async (prompt: string, conversationId: string | null) => {
        setIsProcessing(true);
        try {
            const req: ImagePromptGenerateRequest = { prompt };
            if (uploadedImage && uploadedImage.url) req.userImageUrl = uploadedImage.url;
            const res = await sendPrompt(req, conversationId ?? undefined);
            console.log('Prompt result:', res);
            
            // Store the result to display in PromptResult component
            setPromptResult(res);
            
            // Update URL to reflect the new prompt ID
            if (res?.id) {
                // Pass the prompt object in navigation state so the target route can avoid
                // re-fetching the same resource immediately.
                navigate(`/create/${res.id}`, { replace: true, state: { prompt: res } });
            }
            
            // Optionally clear input after successful send
            setInput('');
        } catch (err) {
            console.error('Failed to send prompt', err);
            // Keep input so user can retry
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEvaluate = async (payload: any) => {
        setIsProcessing(true);
        try {
            if (!promptResult) {
                console.error('No prompt result available for evaluation');
                return;
            }

            // Use evaluatePrompt from the hook with the revision payload
            const revisedResponse = await evaluatePrompt(payload);
            console.log('Evaluation result:', revisedResponse);

            // Send the revised prompt using the conversationId from the original response
            const conversationId = promptResult.conversationId;
            const revisedPrompt = revisedResponse.revisedPrompt || payload.prompt;
            
                if (revisedPrompt) {
                const req: ImagePromptGenerateRequest = { prompt: revisedPrompt };
                if (uploadedImage && uploadedImage.url) req.userImageUrl = uploadedImage.url;
                const newPromptResponse = await sendPrompt(req, conversationId);
                console.log('New prompt result:', newPromptResponse);
                
                // Update the PromptResult with the new response
                setPromptResult(newPromptResponse);
                
                // Update URL to reflect the new prompt ID
                if (newPromptResponse?.id) {
                    navigate(`/create/${newPromptResponse.id}`, { replace: true, state: { prompt: newPromptResponse } });
                }
            }
        } catch (err) {
            console.error('Failed to evaluate and re-send prompt', err);
            // Keep current state so user can retry
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
    // Reset and navigate back to base create URL
        // Reset to show input form again
        setPromptResult(null);
        setInput('');
        // Clear uploaded/generated images and errors so UI returns to initial state
        setUploadedImage(null);
        setGeneratedImage(null);
        setError(null);
        setIsProcessing(false);

        // Navigate back to base create URL and explicitly clear navigation state so
        // the Create effect does not pick up a stale prompt from location.state.
        // Mark that we want to skip hydrating from location.state on the next effect run
        skipLocationHydrateRef.current = true;
        navigate('/create', { replace: true, state: {} });
    };

    const handleGenerate = async (imagePromptId: string) => {
        setIsProcessing(true);
        try {
            console.log('Generating image with prompt ID:', imagePromptId);
            const imageResult = await generateImage(imagePromptId);
            console.log('Generated image result:', imageResult);
            
            // Update the promptResult with the updated imagePrompt that includes the imageId
            if (imageResult.imagePrompt) {
                setPromptResult(imageResult.imagePrompt);
            }
            
            // Set the generated image to display it
            setGeneratedImage(imageResult);
            
            return imageResult;
        } catch (err) {
            console.error('Failed to generate image', err);
            // Handle error - maybe show an error message
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageUploaded = (image: ImageDataResponse) => {
    setUploadedImage(image);
    };

    const handleImageRemoved = () => {
    setUploadedImage(null);
    };

    return (
        <Container maxWidth={'lg'} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 } }}>
            {/* Page selector with "Create" selected */}
            <PageSelector initial="create" />

            {/* Loading state for initial data fetch */}
            {loading && <CircularProgress />}

            {/* Processing state skeletons based on current UI state */}
            {isProcessing && !promptResult && <PromptInputSkeleton />}
            {isProcessing && promptResult && !generatedImage && <PromptResultSkeleton />}
            {isProcessing && generatedImage && <ImageDisplaySkeleton />}

            {/* Error state */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Render PromptInput when no result and not loading or processing */}
            {!promptResult && !loading && !isProcessing && (
                <PromptInput input={input} setInput={setInput} onSend={handleSend} disable={isProcessing} />
            )}

            {/* Image attachment component - always visible when not loading, positioned based on state */}
            {!loading && !disableAttachImage && (
                <PromptAttachImage
                    onImageUploaded={handleImageUploaded}
                    onImageRemoved={handleImageRemoved}
                    disabled={isProcessing}
                />
            )}

            {/* Render PromptResult when result exists and not processing */}
            {promptResult && !loading && !isProcessing && (
                <PromptResult 
                    imageResult={promptResult}
                    onEvaluate={handleEvaluate}
                    onReset={handleReset}
                    onGenerate={handleGenerate}
                    generating={isProcessing}
                    evaluating={isProcessing}
                    generateEnabled={true}
                    disableRewrite={true} // Disable rewrite for loaded prompts
                />
            )}

            {/* Render ImageDisplay when generated image exists and not processing */}
            {generatedImage && !loading && !isProcessing && (
                <ImageDisplay 
                    image={generatedImage}
                    hideBackButton={true}
                    // When ImageDisplay is opened from Create, the right FAB should close
                    // the overlay and return to the PromptResult view. Only clear the
                    // generated image here; keep the existing promptResult in state.
                    onReset={() => setGeneratedImage(null)}
                    onShowPromptResult={(imagePrompt) => {
                        // Go back to the prompt result view
                        setGeneratedImage(null);
                        setPromptResult(imagePrompt);
                    }}
                />
            )}
        </Container>
    );
};

export default Create;
