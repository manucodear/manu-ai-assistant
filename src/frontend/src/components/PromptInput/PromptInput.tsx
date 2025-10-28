import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';
import Typography from '@mui/material/Typography';
import InfoIcon from '@mui/icons-material/Info';

interface PromptInputProps {
  input: string;
  setInput: (s: string) => void;
  onSend: (prompt: string, conversationId: string | null) => void;
  disable: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ input, setInput, onSend, disable }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Description about the prompt improvement process */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <InfoIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          Your prompt will be enhanced with AI-powered improvements including optimized descriptions, 
          artistic styles, camera angles, and visual tags. You'll be able to review and customize 
          these suggestions before generating your image.
        </Typography>
      </Box>
      
      <Box sx={{ position: 'relative', display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1, position: 'relative' }}>
            <TextField
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="Type a prompt and press Send"
            variant="outlined"
            multiline
            minRows={4}
            disabled={disable}
            fullWidth
            sx={{
                // ensure bottom/right padding so content doesn't get obscured by the button
                '& .MuiInputBase-root': {
                  paddingRight: { xs: '16px', md: '88px' },
                  paddingBottom: '8px',
                }
              }}
          />
        {/* Send Button positioned at bottom-right inside the input box */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSend(input, null)}
          disabled={disable || !input.trim()}
          aria-label="Send prompt"
          size="small"
          startIcon={<CreateIcon />}
          sx={{
            position: { xs: 'static', md: 'absolute' },
            bottom: { md: 8 },
            right: { md: 8 },
            zIndex: 1400,
            width: { xs: '100%', md: 'auto' },
            mt: { xs: 1, md: 0 }
          }}
        >
          Write
        </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PromptInput;
