import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';
import Typography from '@mui/material/Typography';
import InfoIcon from '@mui/icons-material/Info';
import { IconButton } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { uploadUserImage, deleteUserImage } from '../../hooks/useUserImage';
import { ImageDataResponse } from '../../hooks/useImage.types';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import { useRef, useState } from 'react';

interface PromptInputProps {
  input: string;
  setInput: (s: string) => void;
  onSend: (prompt: string, conversationId: string | null) => void;
  disable: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ input, setInput, onSend, disable }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<ImageDataResponse | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // Only accept image types
    if (!f.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
      return;
    }

  setUploading(true);
  setUploadMessage('Uploading...');
    try {
      const res = await uploadUserImage(f as File);
      // success - store uploaded image data for thumbnail
      setUploadedImage(res ?? null);
      setUploadMessage('Upload successful');
      // Optionally you might want to insert the uploaded image URL into the input
      // setInput((prev) => `${prev}\n${res.url}`);
    } catch (err: any) {
      setUploadMessage(err?.message ?? 'Upload failed');
    } finally {
  setUploading(false);
      // clear the file input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      window.setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  const handleRemoveUploaded = async () => {
    if (!uploadedImage) return;
    setRemoving(true);
    setUploadMessage('Removing...');
    try {
      const url = uploadedImage.url || uploadedImage.largeUrl || uploadedImage.mediumUrl || uploadedImage.smallUrl || '';
      let filename = url;
      try {
        const u = new URL(url);
        filename = u.pathname.split('/').pop() || url;
      } catch {
        // leave filename as url if URL parsing fails
        filename = url;
      }
      // The backend expects the raw filename (UUID) without extensions or size suffixes.
      // Example: '8eeee82d-...-ce5c.small.png' -> '8eeee82d-...-ce5c'
      filename = String(filename).split('.')[0];
      await deleteUserImage(filename);
      setUploadedImage(null);
      setUploadMessage('Removed');
    } catch (err: any) {
      setUploadMessage(err?.message ?? 'Remove failed');
    } finally {
      setRemoving(false);
      window.setTimeout(() => setUploadMessage(null), 2000);
    }
  };
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <IconButton aria-label="attach" onClick={handleAttachClick} disabled={uploading || Boolean(uploadedImage)}>
          <AttachFileIcon />
        </IconButton>
        {uploading && <CircularProgress size={18} />}
        {uploadedImage && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Box sx={{ position: 'relative', width: 48, height: 48, mr: 0.5 }}>
              <Box component="img" src={uploadedImage.smallUrl || uploadedImage.url} alt="uploaded" sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }} />
              <IconButton
                aria-label="remove-upload"
                size="small"
                onClick={handleRemoveUploaded}
                disabled={removing}
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 26,
                  height: 26,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  p: 0.5,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
        {uploadMessage && <Typography variant="body2" color="text.secondary">{uploadMessage}</Typography>}
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
