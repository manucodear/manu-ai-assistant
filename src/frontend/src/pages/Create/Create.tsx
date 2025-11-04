import React from 'react';
import { Container } from '@mui/material';
import PageSelector from '../../components/PageSelector';
import PromptInput from '../../components/PromptInput/PromptInput';
import useImagePrompt from '../../hooks/useImagePrompt';

const Create: React.FC = () => {
    const [input, setInput] = React.useState<string>('');
    const { sendPrompt, sending } = useImagePrompt();

    const handleSend = async (prompt: string, conversationId: string | null) => {
        try {
            // Delegate to the hook which handles sending state
            const res = await sendPrompt({ prompt }, conversationId ?? undefined);
            console.log('Prompt result:', res);
            // Optionally clear input after successful send
            setInput('');
        } catch (err) {
            console.error('Failed to send prompt', err);
            // Keep input so user can retry
        }
    };

    return (
        <Container maxWidth={'lg'} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 } }}>
            {/* Page selector with "Create" selected */}
            <PageSelector initial="create" />

            {/* Prompt input shown directly on the Create page */}
            <PromptInput input={input} setInput={setInput} onSend={handleSend} disable={sending} />
        </Container>
    );
};

export default Create;
