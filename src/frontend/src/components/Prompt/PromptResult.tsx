// React imported at top
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { AutoAwesome as ImageSparkle } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import Fab from '@mui/material/Fab';
import EvaluateIcon from '@mui/icons-material/Publish';
import Alert from '@mui/material/Alert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ImagePromptTags {
  Included: string[];
  NotIncluded: string[];
}

interface ImagePromptResult {
  OriginalPrompt: string;
  ImprovedPrompt: string;
  MainDifferences: string;
  Tags: ImagePromptTags;
  PointOfViews: string[];
}

import React from 'react';

interface PromptResultProps {
  imageResult: ImagePromptResult;
  // optional external handler for evaluation (receives the payload and returns a Promise)
  onEvaluate?: (payload: any) => Promise<any>;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // optional generate handler: receives the improved prompt
  onGenerate?: (improvedPrompt: string) => Promise<any>;
  // whether a generate request is in progress
  generating?: boolean;
}

const PromptResult: React.FC<PromptResultProps> = ({ imageResult, onEvaluate, onReset, onGenerate, generating }) => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(() => [...(imageResult.Tags?.Included || [])]);
  const [tagsAnchorEl, setTagsAnchorEl] = React.useState<HTMLElement | null>(null);
  const [selectedPOV, setSelectedPOV] = React.useState<string | null>(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'PointOfViewRaw')) {
      const raw = (imageResult as any).PointOfViewRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return null;
    }
    return (imageResult.PointOfViews && imageResult.PointOfViews[0]) ?? null;
  });
  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);
  const [copyOpen, setCopyOpen] = React.useState<boolean>(false);
  const [evaluateSuccess, setEvaluateSuccess] = React.useState<string | null>(null);
  const [evaluateError, setEvaluateError] = React.useState<string | null>(null);

  const handleEvaluate = async () => {
    setEvaluateSuccess(null);
    setEvaluateError(null);

    const payload = {
      prompt: imageResult.ImprovedPrompt,
      tags: {
        toInclude: selectedTags,
        toExclude: (imageResult.Tags?.Included || []).filter((t) => !selectedTags.includes(t)),
      },
      pointOfView: selectedPOV ?? '',
    } as any;

    try {
      if (onEvaluate) {
        await onEvaluate(payload);
        setEvaluateSuccess('Evaluation successful');
      } else {
        const base = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${base}/imagePrompt`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setEvaluateSuccess('Evaluation successful');
        } else {
          const txt = await res.text();
          throw new Error(txt || `Request failed: ${res.status}`);
        }
      }
    } catch (err: any) {
      setEvaluateError(err?.message ?? 'Unknown error');
    } finally {
      // auto-dismiss alerts after 5s
      if (evaluateSuccess || evaluateError) {
        window.setTimeout(() => {
          setEvaluateSuccess(null);
          setEvaluateError(null);
        }, 5000);
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', pb: '72px' }}>
      <Paper elevation={0} sx={{ p: 1, position: 'relative' }}>
        <Box sx={{ fontWeight: 600, mb: 1 }}>Improved prompt</Box>
        <IconButton
          aria-label="Copy improved prompt"
          size="small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(String(imageResult.ImprovedPrompt || ''));
              setCopyMessage('Copied to clipboard');
              setCopyOpen(true);
            } catch (e) {
              setCopyMessage('Copy failed');
              setCopyOpen(true);
            }
          }}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
        <Box sx={{ whiteSpace: 'pre-wrap', mb: 1, fontStyle: 'italic' }}>{imageResult.ImprovedPrompt}</Box>
        {/* Visual-only Generate button (right-aligned) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<ImageSparkle />}
            onClick={() => onGenerate && onGenerate(imageResult.ImprovedPrompt)}
            disabled={generating}
          >
            Generate
          </Button>
        </Box>
        <Snackbar
          open={copyOpen}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={() => {
            setCopyOpen(false);
            setCopyMessage(null);
          }}
        >
          {/* use Alert inside Snackbar for consistent styling */}
          <Alert onClose={() => { setCopyOpen(false); setCopyMessage(null); }} severity={copyMessage === 'Copy failed' ? 'error' : 'success'} sx={{ width: '100%' }}>
            {copyMessage}
          </Alert>
        </Snackbar>
      </Paper>

      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box>
            <Button variant="outlined" onClick={(e: React.MouseEvent<HTMLElement>) => setTagsAnchorEl(e.currentTarget)}>
              Tags ({selectedTags.length})
            </Button>
            <Menu anchorEl={tagsAnchorEl} open={Boolean(tagsAnchorEl)} onClose={() => setTagsAnchorEl(null)} PaperProps={{ style: { maxHeight: 320 } }}>
              <ListSubheader>Included</ListSubheader>
              {(imageResult.Tags?.Included || []).map((t: string) => (
                <MenuItem
                  key={`inc-${t}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    setSelectedTags((prev: string[]) => (prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t]));
                  }}
                >
                  <Checkbox checked={selectedTags.includes(t)} />
                  <ListItemText primary={t} />
                </MenuItem>
              ))}

              <ListSubheader>Not included</ListSubheader>
              {(imageResult.Tags?.NotIncluded || []).map((t: string) => (
                <MenuItem
                  key={`not-${t}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    setSelectedTags((prev: string[]) => (prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t]));
                  }}
                >
                  <Checkbox checked={selectedTags.includes(t)} />
                  <ListItemText primary={t} />
                </MenuItem>
              ))}

              <MenuItem onClick={() => setTagsAnchorEl(null)}>
                <ListItemText primary="Done" />
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {selectedTags.map((t: string) => {
            const isIncluded = (imageResult.Tags?.Included || []).includes(t);
            const isNotIncluded = (imageResult.Tags?.NotIncluded || []).includes(t);
            if (isIncluded) {
              return (
                <Chip key={`chip-${t}`} label={t} size="medium" color="primary" sx={{ mr: 1, mb: 1 }} />
              );
            }
            if (isNotIncluded) {
              return (
                <Chip key={`chip-${t}`} label={t} size="medium" color="secondary" sx={{ mr: 1, mb: 1 }} />
              );
            }
            return <Chip key={`chip-${t}`} label={t} size="medium" sx={{ mr: 1, mb: 1 }} />;
          })}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
        {imageResult.PointOfViews && imageResult.PointOfViews.length > 0 && (
          <Box>
            <Box sx={{ fontWeight: 600, mb: 1 }}>Point of views</Box>
            <ToggleButtonGroup value={selectedPOV} exclusive onChange={(_e, newVal) => setSelectedPOV(newVal)} aria-label="Point of view" size="small">
              {(imageResult.PointOfViews || []).map((p: string) => (
                <ToggleButton color="primary" key={p} value={p} aria-label={p}>
                  {p}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}
      </Paper>
      {/* publish alerts */}
      {evaluateSuccess && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {evaluateSuccess}
        </Alert>
      )}
      {evaluateError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {evaluateError}
        </Alert>
      )}

      <div>


        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="original-content" id="original-header">
            <Typography color="info" variant="subtitle1">Source prompt</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{imageResult.OriginalPrompt}</Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="differences-content" id="differences-header">
            <Typography color="info" variant="subtitle1">Main differences</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{imageResult.MainDifferences}</Typography>
          </AccordionDetails>
        </Accordion>
      </div>
      {/* Publish FAB (positioned inside this component's relative Box) */}
      <Fab
        color="primary"
        onClick={handleEvaluate}
        aria-label="Evaluate prompt"
        sx={{ position: 'absolute', bottom: 8, right: 0 }}
      >
        <EvaluateIcon />
      </Fab>

      {/* fixed Reset FAB (viewport-fixed) rendered when onReset is available */}
      {typeof onReset === 'function' && (
        <Box sx={{ position: 'absolute', bottom: 8, left: 0}}>
          <Fab color="default" aria-label="Reset prompt" onClick={() => onReset && onReset()}>
            <RestartAltIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default PromptResult;
