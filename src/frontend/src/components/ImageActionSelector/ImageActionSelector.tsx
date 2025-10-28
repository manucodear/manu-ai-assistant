import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Collections as ImageMultiple } from '@mui/icons-material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface Props {
    activeTab?: 'generate' | 'gallery';
    isShowingPromptResult?: boolean;
    onShowGenerate?: () => void;
    onShowGallery?: () => void;
}

const ImageActionSelector: React.FC<Props> = ({ activeTab = 'generate', isShowingPromptResult = false, onShowGenerate, onShowGallery }) => {
    const handleChange = (_: React.MouseEvent<HTMLElement>, value: 'generate' | 'gallery' | null) => {
        if (!value) return;
        if (value === 'generate') {
            onShowGenerate && onShowGenerate();
        } else if (value === 'gallery') {
            onShowGallery && onShowGallery();
        }
    };

    // when `isShowingPromptResult` is true we want 'generate' selected
    const selected = isShowingPromptResult ? 'generate' : activeTab;

    return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mx: 'auto', justifyContent: 'center' }}>
            <ToggleButtonGroup
                value={selected}
                exclusive
                onChange={handleChange}
                aria-label="image action selector"
                size="small"
                color="primary"
            >
                <ToggleButton
                    value="generate"
                    aria-label="create"
                    sx={(theme) => ({
                        textTransform: 'none',
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            },
                        },
                    })}
                >
                    <AutoFixHighIcon sx={{ mr: 1 }} />
                    Create
                </ToggleButton>
                <ToggleButton
                    value="gallery"
                    aria-label="gallery"
                    sx={(theme) => ({
                        textTransform: 'none',
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            },
                        },
                    })}
                >
                    <ImageMultiple sx={{ mr: 1 }} />
                    Gallery
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

export default ImageActionSelector;
