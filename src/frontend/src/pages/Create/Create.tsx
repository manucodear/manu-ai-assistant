import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Alert } from '@mui/material';
import PageSelector from '../../components/PageSelector';
import PromptInput from '../../components/PromptInput/PromptInput';
import PromptResult from '../../components/PromptResult/PromptResult';
import PromptInputSkeleton from '../../components/PromptInputSkeleton';
import PromptResultSkeleton from '../../components/PromptResultSkeleton';
import ImageDisplaySkeleton from '../../components/ImageDisplaySkeleton';
//import PromptAttachImage from '../../components/PromptAttachImage';
import ImageDisplay from '../../components/ImageDisplay/ImageDisplay';
import useImagePrompt from '../../hooks/useImagePrompt';
import { ImagePromptResponse } from '../../hooks/useImagePrompt.types';
//import { ImageDataResponse, ImageResponse } from '../../hooks/useImage.types';
import { ImageResponse } from '../../hooks/useImage.types';

const Create: React.FC = () => {
    const { imagePromptId } = useParams();
    const navigate = useNavigate();
    const [input, setInput] = React.useState<string>('');
    const [promptResult, setPromptResult] = React.useState<ImagePromptResponse | null>(null);
    //const [uploadedImage, setUploadedImage] = React.useState<ImageDataResponse | null>(null); // Store uploaded image data
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = React.useState<ImageResponse | null>(null);
    const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
    const { sendPrompt, getImagePromptById, evaluatePrompt, generateImage } = useImagePrompt();

    // Load image prompt data when imagePromptId is present in URL
    React.useEffect(() => {
        let mounted = true;
        const fetchPrompt = async () => {
            if (!imagePromptId) return;
            setLoading(true);
            setError(null);
            try {
                const res = await getImagePromptById(imagePromptId);
                if (mounted) {
                    setPromptResult(res);
                    // Optionally set the original prompt in the input field
                    // setInput(res.originalPrompt || '');
                }
            } catch (err: any) {
                if (mounted) setError(err?.message ?? 'Failed to fetch prompt');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPrompt();
        return () => { mounted = false; };
    }, [imagePromptId]); // Removed getImagePromptById from dependencies

    const handleSend = async (prompt: string, conversationId: string | null) => {
        setIsProcessing(true);
        try {
            const res = await sendPrompt({ prompt }, conversationId ?? undefined);
            console.log('Prompt result:', res);
            
            // Store the result to display in PromptResult component
            setPromptResult(res);
            
            // Update URL to reflect the new prompt ID
            if (res?.id) {
                navigate(`/create/${res.id}`, { replace: true });
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
                const newPromptResponse = await sendPrompt({ prompt: revisedPrompt }, conversationId);
                console.log('New prompt result:', newPromptResponse);
                
                // Update the PromptResult with the new response
                setPromptResult(newPromptResponse);
                
                // Update URL to reflect the new prompt ID
                if (newPromptResponse?.id) {
                    navigate(`/create/${newPromptResponse.id}`, { replace: true });
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
        // Reset to show input form again
        setPromptResult(null);
        setInput('');
        //setUploadedImage(null);
        
        // Navigate back to base create URL
        navigate('/create', { replace: true });
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

    // const handleImageUploaded = (image: ImageDataResponse) => {
    //     setUploadedImage(image);
    //     // Optionally you might want to insert the uploaded image URL into the input
    //     // setInput((prev) => `${prev}\n${image.url}`);
    //     console.log('Image uploaded:', image);
    // };

    // const handleImageRemoved = () => {
    //     setUploadedImage(null);
    //     console.log('Image removed');
    // };

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
            {/* {!loading && (
                <PromptAttachImage
                    onImageUploaded={handleImageUploaded}
                    onImageRemoved={handleImageRemoved}
                    disabled={sending || Boolean(promptResult)}
                />
            )} */}

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
