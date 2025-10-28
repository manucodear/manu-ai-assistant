import React from 'react';
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
import CreateIcon from '@mui/icons-material/Create';
import useImagePrompt from '../../hooks/useImagePrompt';
import Alert from '@mui/material/Alert';
import { ImagePromptRevisionRequest } from '../../hooks/useImagePrompt.types';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ImagePromptResponse } from '../../hooks/useImagePrompt.types';

interface PromptResultProps {
  imageResult: ImagePromptResponse;
  onEvaluate?: (payload: ImagePromptRevisionRequest) => Promise<any>;
  onReset?: () => void;
  // now expects an imagePromptId string
  onGenerate?: (imagePromptId: string) => Promise<any>;
  generating?: boolean;
  // Parent (Prompt) controls whether Generate is enabled. If omitted, default to true.
  generateEnabled?: boolean;
}

const PromptResult: React.FC<PromptResultProps> = ({ imageResult, onEvaluate, onReset, onGenerate, generating, generateEnabled }) => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(() => [...(imageResult.tags?.included || [])]);
  const [tagsAnchorEl, setTagsAnchorEl] = React.useState<HTMLElement | null>(null);
  const [selectedPOV, setSelectedPOV] = React.useState<string>(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'pointOfViewRaw')) {
      const raw = (imageResult as any).pointOfViewRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return '';
    }
    return (imageResult.pointOfViews && imageResult.pointOfViews[0]) ?? '';
  });
  const [selectedImageStyle, setSelectedImageStyle] = React.useState<string>(() => {
    if (Object.prototype.hasOwnProperty.call(imageResult, 'imageStyleRaw')) {
      const raw = (imageResult as any).imageStyleRaw;
      if (raw && String(raw).trim()) return String(raw).trim();
      return '';
    }
    return (imageResult.imageStyles && imageResult.imageStyles[0]) ?? '';
  });

  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);
  const [copyOpen, setCopyOpen] = React.useState<boolean>(false);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [povDrawerOpen, setPovDrawerOpen] = React.useState(false);
  const [styleDrawerOpen, setStyleDrawerOpen] = React.useState(false);
  const [evaluateSuccess, setEvaluateSuccess] = React.useState<string | null>(null);
  const [evaluateError, setEvaluateError] = React.useState<string | null>(null);

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

  const tagSetsEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every((x) => setB.has(x));
  };

  const hasTagChanges = !tagSetsEqual(selectedTags, originalIncluded);
  const hasPOVChange = (selectedPOV ?? null) !== (originalPOV ?? null);
  const hasImageStyleChange = (selectedImageStyle ?? null) !== (originalImageStyle ?? null);
  const hasAnyChange = hasTagChanges || hasPOVChange || hasImageStyleChange;

  const { evaluatePrompt } = useImagePrompt();

  const handleEvaluate = async () => {
    setEvaluateSuccess(null);
    setEvaluateError(null);

    const payloadResult: ImagePromptRevisionRequest = {
      prompt: imageResult.improvedPrompt ?? imageResult.originalPrompt ?? '',
      revisionTags: {
        toInclude: selectedTags,
        toExclude: (imageResult.tags?.notIncluded ?? []).filter((t) => !selectedTags.includes(t)),
      },
      pointOfView: selectedPOV ?? '',
      imageStyle: selectedImageStyle ?? '',
    };

    try {
      if (onEvaluate) {
        await onEvaluate(payloadResult);
        setEvaluateSuccess('Evaluation successful');
      } else {
        await evaluatePrompt(payloadResult as any);
        setEvaluateSuccess('Evaluation successful');
      }
    } catch (err: any) {
      setEvaluateError(err?.message ?? 'Unknown error');
    } finally {
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
      {/* Improved prompt + POV grouped inside a Paper */}
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

        {/* Action row: Reset (left) - Generate + ReWrite (right) */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {typeof onReset === 'function' && (
                <Button variant="outlined" size="small" startIcon={<RestartAltIcon />} onClick={() => onReset && onReset()}>
                  Reset
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={<ImageSparkle />}
                onClick={() => onGenerate && onGenerate(String(imageResult.id))}
                // Parent controls generateEnabled; default to true when omitted
                disabled={!(generateEnabled ?? true) || Boolean(generating) || hasAnyChange}
                title={hasAnyChange ? 'Change tags or point of view back to original to enable generate' : undefined}
              >
                Generate
              </Button>
              <Button variant="contained" color="primary" size="small" startIcon={<CreateIcon />} onClick={handleEvaluate}>
                ReWrite
              </Button>
            </Box>
          </Box>
        </Box>

        <Snackbar open={copyOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} onClose={() => { setCopyOpen(false); setCopyMessage(null); }}>
          <Alert onClose={() => { setCopyOpen(false); setCopyMessage(null); }} severity={copyMessage === 'Copy failed' ? 'error' : 'success'} sx={{ width: '100%' }}>
            {copyMessage}
          </Alert>
        </Snackbar>
      </Paper>

      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ mt: 0 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', overflowX: { xs: 'auto', sm: 'visible' }, whiteSpace: { xs: 'nowrap', sm: 'normal' } }}>
              <ToggleButtonGroup
                value={selectedPOV}
                exclusive
                onChange={(_e, newVal) => setSelectedPOV(newVal)}
                aria-label="Point of view"
                size="small"
                sx={{ display: 'inline-flex' }}
              >
                {(imageResult.pointOfViews || []).map((p: string) => (
                  <ToggleButton key={p} color="primary" value={p} aria-label={p} sx={{ minWidth: { xs: 88, sm: 64 }, fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
                    {p}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tags & chips - separate Paper */}
      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box>
            <Button variant="contained" size="small" onClick={(e: React.MouseEvent<HTMLElement>) => setTagsAnchorEl(e.currentTarget)}>
              Tags ({selectedTags.length})
            </Button>
            <Menu anchorEl={tagsAnchorEl} open={Boolean(tagsAnchorEl)} onClose={() => setTagsAnchorEl(null)} PaperProps={{ style: { maxHeight: 320 } }}>
              <ListSubheader>Included</ListSubheader>
              {(imageResult.tags?.included || []).map((t: string) => (
                <MenuItem key={`inc-${t}`} onClick={(ev) => { ev.preventDefault(); setSelectedTags((prev: string[]) => (prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t])); }}>
                  <Checkbox checked={selectedTags.includes(t)} />
                  <ListItemText primary={t} />
                </MenuItem>
              ))}

              <ListSubheader>Not included</ListSubheader>
              {(imageResult.tags?.notIncluded || []).map((t: string) => (
                <MenuItem key={`not-${t}`} onClick={(ev) => { ev.preventDefault(); setSelectedTags((prev: string[]) => (prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t])); }}>
                  <Checkbox checked={selectedTags.includes(t)} />
                  <ListItemText primary={t} />
                </MenuItem>
              ))}

              <MenuItem onClick={() => setTagsAnchorEl(null)}>
                <ListItemText primary="Done" />
              </MenuItem>
            </Menu>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {selectedTags.map((t: string) => {
              const isIncluded = (imageResult.tags?.included || []).includes(t);
              const isNotIncluded = (imageResult.tags?.notIncluded || []).includes(t);
              const handleDelete = () => setSelectedTags((prev) => prev.filter((x) => x !== t));
              if (isIncluded) {
                return (
                  <Chip key={`chip-${t}`} label={t} size="small" color="primary" variant="outlined" onDelete={handleDelete} aria-label={`Remove tag ${t}`} sx={{ mr: 1, mb: 1 }} />
                );
              }
              if (isNotIncluded) {
                return (
                  <Chip key={`chip-${t}`} label={t} size="small" color="secondary" variant="outlined" onDelete={handleDelete} aria-label={`Remove tag ${t}`} sx={{ mr: 1, mb: 1 }} />
                );
              }
              return (
                <Chip key={`chip-${t}`} label={t} size="small" variant="outlined" onDelete={handleDelete} aria-label={`Remove tag ${t}`} sx={{ mr: 1, mb: 1 }} />
              );
            })}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
        {/* Image styles - its own Paper and responsive picker */}
        {imageResult.imageStyles && imageResult.imageStyles.length > 0 && (
          <Box sx={{ mt: 0 }}>
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
                justifyContent: 'center',
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
                      sx={{ minWidth: { xs: 72, sm: 56 }, fontSize: { xs: '0.72rem', sm: '0.78rem' } }}
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
        <Alert severity="success" sx={{ mt: 1 }}>{evaluateSuccess}</Alert>
      )}
      {evaluateError && (
        <Alert severity="error" sx={{ mt: 1 }}>{evaluateError}</Alert>
      )}
      <Paper elevation={0} sx={{ p: 1, mt: 1 }}>
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
      </Paper>
      
    </Box>
  );
};

export default PromptResult;
