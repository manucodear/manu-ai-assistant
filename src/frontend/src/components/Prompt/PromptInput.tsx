import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Fab from '@mui/material/Fab';
import SendIcon from '@mui/icons-material/Send';

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
          />
        {/* place the send FAB at the top-right inside the input box */}
        <Fab
          color="primary"
          onClick={onSend}
          disabled={sending || !input.trim()}
          aria-label="Send prompt"
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1400 }}
        >
          <SendIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default PromptInput;
