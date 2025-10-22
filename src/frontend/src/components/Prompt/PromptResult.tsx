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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Radio from '@mui/material/Radio';
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
  included: string[];
  notIncluded: string[];
}

interface ImagePromptResult {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  mainDifferences: string;
  tags: ImagePromptTags;
  pointOfViews: string[];
  imageStyles: string[];
  imageStyleRaw?: string | null;
  imageStyle?: string | null;
  // raw singular PointOfView from server when present (may be empty string)
  pointOfViewRaw?: string | null;
  // Conversation identifier returned by the backend for this prompt result
  conversationId: string;
}

import React from 'react';

interface PromptResultProps {
  imageResult: ImagePromptResult;
  // optional external handler for evaluation (receives the payload and returns a Promise)
  onEvaluate?: (payload: any) => Promise<any>;
  // optional reset handler to return to initial input state
  onReset?: () => void;
  // optional generate handler: receives the improved prompt
  onGenerate?: (result: ImagePromptResult) => Promise<any>;
  // whether a generate request is in progress
  generating?: boolean;
  // optional conversation tracking values
  conversationId?: string | null;
  setConversationId?: (id: string | null) => void;
}

const PromptResult: React.FC<PromptResultProps> = ({ imageResult, onEvaluate, onReset, onGenerate, generating, conversationId, setConversationId }) => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(() => [...(imageResult.tags?.included || [])]);
  const [tagsAnchorEl, setTagsAnchorEl] = React.useState<HTMLElement | null>(null);
  const [selectedPOV, setSelectedPOV] = React.useState<string | null>(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'pointOfViewRaw')) {
      const raw = (imageResult as any).pointOfViewRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return null;
    }
    return (imageResult.pointOfViews && imageResult.pointOfViews[0]) ?? null;
  });
  const [selectedImageStyle, setSelectedImageStyle] = React.useState<string | null>(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'imageStyleRaw')) {
      const raw = (imageResult as any).imageStyleRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return null;
    }
    return (imageResult.imageStyles && imageResult.imageStyles[0]) ?? null;
  });
  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);
  const [copyOpen, setCopyOpen] = React.useState<boolean>(false);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [povDrawerOpen, setPovDrawerOpen] = React.useState(false);
  const [styleDrawerOpen, setStyleDrawerOpen] = React.useState(false);
  const [evaluateSuccess, setEvaluateSuccess] = React.useState<string | null>(null);
  const [evaluateError, setEvaluateError] = React.useState<string | null>(null);

  // Keep originals (derived from the incoming imageResult) so we can detect changes
  const originalIncluded = React.useMemo(() => [...(imageResult.tags?.included || [])], [imageResult]);
  const originalPOV = React.useMemo(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'pointOfViewRaw')) {
      const raw = (imageResult as any).pointOfViewRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return null;
    }
    return (imageResult.pointOfViews && imageResult.pointOfViews[0]) ?? null;
  }, [imageResult]);
  const originalImageStyle = React.useMemo(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'imageStyleRaw')) {
      const raw = (imageResult as any).imageStyleRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return null;
    }
    return (imageResult.imageStyles && imageResult.imageStyles[0]) ?? null;
  }, [imageResult]);

  // helper to compare tag sets (order-insensitive)
  const tagSetsEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every((x) => setB.has(x));
  };

  const hasTagChanges = !tagSetsEqual(selectedTags, originalIncluded);
  const hasPOVChange = (selectedPOV ?? null) !== (originalPOV ?? null);
  const hasImageStyleChange = (selectedImageStyle ?? null) !== (originalImageStyle ?? null);
  const hasAnyChange = hasTagChanges || hasPOVChange || hasImageStyleChange;

  // avoid unused prop lint errors - may be used by parent in future
  if (typeof conversationId !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug && console.debug('conversationId (PromptResult):', conversationId, 'setConversationId:', typeof setConversationId);
  }

  const handleEvaluate = async () => {
    setEvaluateSuccess(null);
    setEvaluateError(null);

    const payloadResult: ImagePromptResult = {
      id: imageResult.id,
      originalPrompt: imageResult.originalPrompt,
      improvedPrompt: imageResult.improvedPrompt,
      mainDifferences: imageResult.mainDifferences,
      tags: {
        included: selectedTags,
        notIncluded: imageResult.tags?.notIncluded ?? [],
      },
      pointOfViews: imageResult.pointOfViews || [],
      pointOfViewRaw: selectedPOV ?? null,
      imageStyles: imageResult.imageStyles || [],
      imageStyleRaw: selectedImageStyle ?? null,
      imageStyle: selectedImageStyle ?? null,
      conversationId: imageResult.conversationId ?? '',
    };

    try {
      if (onEvaluate) {
        await onEvaluate(payloadResult);
        setEvaluateSuccess('Evaluation successful');
      } else {
        const base = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${base}/imagePrompt`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payloadResult),
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
              await navigator.clipboard.writeText(String(imageResult.improvedPrompt || ''));
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
        <Box sx={{ whiteSpace: 'pre-wrap', mb: 1, fontStyle: 'italic' }}>{imageResult.improvedPrompt}</Box>
        {/* Visual-only Generate button (right-aligned) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<ImageSparkle />}
            onClick={() => onGenerate && onGenerate(imageResult)}
            disabled={generating || hasAnyChange}
            title={hasAnyChange ? 'Change tags or point of view back to original to enable generate' : undefined}
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
              {(imageResult.tags?.included || []).map((t: string) => (
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
              {(imageResult.tags?.notIncluded || []).map((t: string) => (
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
            const isIncluded = (imageResult.tags?.included || []).includes(t);
            const isNotIncluded = (imageResult.tags?.notIncluded || []).includes(t);
            const handleDelete = () => setSelectedTags((prev) => prev.filter((x) => x !== t));
            if (isIncluded) {
              return (
                <Chip
                  key={`chip-${t}`}
                  label={t}
                  size="small"
                  color="primary"
                  onDelete={handleDelete}
                  aria-label={`Remove tag ${t}`}
                  sx={{ mr: 1, mb: 1 }}
                />
              );
            }
            if (isNotIncluded) {
              return (
                <Chip
                  key={`chip-${t}`}
                  label={t}
                  size="small"
                  color="secondary"
                  onDelete={handleDelete}
                  aria-label={`Remove tag ${t}`}
                  sx={{ mr: 1, mb: 1 }}
                />
              );
            }
            return (
              <Chip
                key={`chip-${t}`}
                label={t}
                size="small"
                onDelete={handleDelete}
                aria-label={`Remove tag ${t}`}
                sx={{ mr: 1, mb: 1 }}
              />
            );
          })}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
            {imageResult.pointOfViews && imageResult.pointOfViews.length > 0 && (
              <Box>
                <Box sx={{ fontWeight: 600, mb: 1 }}>Point of views</Box>
                {isSmall ? (
                  <>
                    <Button variant="outlined" size="small" onClick={() => setPovDrawerOpen(true)}>
                      {selectedPOV ?? 'Choose point of view'}
                    </Button>
                    <SwipeableDrawer anchor="bottom" open={povDrawerOpen} onClose={() => setPovDrawerOpen(false)} onOpen={() => setPovDrawerOpen(true)}>
                      <Box sx={{ p: 1 }}>
                        <List>
                          {(imageResult.pointOfViews || []).map((p: string) => (
                            <ListItemButton key={p} onClick={() => { setSelectedPOV(p); setPovDrawerOpen(false); }}>
                              <Radio checked={selectedPOV === p} />
                              <ListItemText primary={p} />
                            </ListItemButton>
                          ))}
                        </List>
                      </Box>
                    </SwipeableDrawer>
                  </>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: { xs: 'auto', sm: 'visible' },
                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                  }}>
                    <ToggleButtonGroup
                      value={selectedPOV}
                      exclusive
                      onChange={(_e, newVal) => setSelectedPOV(newVal)}
                      aria-label="Point of view"
                      size="small"
                      sx={{ display: 'inline-flex' }}
                    >
                      {(imageResult.pointOfViews || []).map((p: string) => (
                        <ToggleButton
                          color="primary"
                          key={p}
                          value={p}
                          aria-label={p}
                          sx={{ minWidth: { xs: 88, sm: 64 }, fontSize: { xs: '0.82rem', sm: '0.875rem' } }}
                        >
                          {p}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                )}
              </Box>
            )}
      {imageResult.imageStyles && imageResult.imageStyles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ fontWeight: 600, mb: 1 }}>Image styles</Box>
          {isSmall ? (
            <>
              <Button variant="outlined" size="small" onClick={() => setStyleDrawerOpen(true)}>
                {selectedImageStyle ?? 'Choose image style'}
              </Button>
              <SwipeableDrawer anchor="bottom" open={styleDrawerOpen} onClose={() => setStyleDrawerOpen(false)} onOpen={() => setStyleDrawerOpen(true)}>
                <Box sx={{ p: 1 }}>
                  <List>
                    {(imageResult.imageStyles || []).map((s: string) => (
                      <ListItemButton key={s} onClick={() => { setSelectedImageStyle(s); setStyleDrawerOpen(false); }}>
                        <Radio checked={selectedImageStyle === s} />
                        <ListItemText primary={s} />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </SwipeableDrawer>
            </>
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              overflowX: { xs: 'auto', sm: 'visible' },
              whiteSpace: { xs: 'nowrap', sm: 'normal' },
            }}>
              <ToggleButtonGroup
                value={selectedImageStyle}
                exclusive
                onChange={(_e, newVal) => setSelectedImageStyle(newVal)}
                aria-label="Image style"
                size="small"
                sx={{ display: 'inline-flex' }}
              >
                {(imageResult.imageStyles || []).map((s: string) => (
                  <ToggleButton
                    color="primary"
                    key={s}
                    value={s}
                    aria-label={s}
                    sx={{ minWidth: { xs: 88, sm: 64 }, fontSize: { xs: '0.82rem', sm: '0.875rem' } }}
                  >
                    {s}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
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
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{imageResult.originalPrompt}</Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="differences-content" id="differences-header">
            <Typography color="info" variant="subtitle1">Main differences</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{imageResult.mainDifferences}</Typography>
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
        <Box sx={{ position: 'absolute', bottom: 8, left: 0 }}>
          <Fab color="default" aria-label="Reset prompt" onClick={() => onReset && onReset()}>
            <RestartAltIcon />
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default PromptResult;
