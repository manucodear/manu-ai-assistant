import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';

interface PromptInputProps {
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  sending: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ input, setInput, onSend, sending }) => {
  return (
    <Box sx={{ position: 'relative', display: 'flex', gap: 1 }}>
      <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="Type a prompt and press Send"
            variant="outlined"
            multiline
            minRows={4}
            disabled={sending}
            fullWidth
            sx={{
              // ensure bottom/right padding so content doesn't get obscured by the button
              '& .MuiInputBase-root': {
                paddingRight: '88px',
                paddingBottom: '8px',
              }
            }}
          />
        {/* Send Button positioned at bottom-right inside the input box */}
        <Button
          variant="contained"
          color="primary"
          onClick={onSend}
          disabled={sending || !input.trim()}
          aria-label="Send prompt"
          size="small"
          startIcon={<CreateIcon />}
          sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1400 }}
        >
          Write
        </Button>
      </Box>
    </Box>
  );
};

export default PromptInput;
