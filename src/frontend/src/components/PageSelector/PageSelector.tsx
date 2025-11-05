import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import { Collections as ImageMultiple } from '@mui/icons-material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useNavigate } from 'react-router-dom';

interface Props {
    // optional initial selection
    initial?: 'create' | 'gallery';
}

const PageSelector: React.FC<Props> = ({ initial = 'create' }) => {
    const navigate = useNavigate();
    const [selected, setSelected] = React.useState<'create' | 'gallery'>(initial);

    const handleSelect = (value: 'create' | 'gallery') => {
        setSelected(value);
        if (value === 'create') {
            navigate('/create');
        } else {
            navigate('/gallery');
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ButtonGroup size="small" aria-label="page selector" variant="outlined">
                <Button
                    onClick={() => handleSelect('create')}
                    aria-pressed={selected === 'create'}
                    sx={(theme) => ({
                        textTransform: 'none',
                        borderColor: theme.palette.primary.main,
                        backgroundColor: selected === 'create' ? theme.palette.primary.main : undefined,
                        color: selected === 'create' ? theme.palette.primary.contrastText : theme.palette.primary.main,
                        '&:hover': selected === 'create' ? { backgroundColor: theme.palette.primary.dark } : undefined,
                    })}
                >
                    <AutoFixHighIcon sx={{ mr: 1 }} />
                    Create
                </Button>
                <Button
                    onClick={() => handleSelect('gallery')}
                    aria-pressed={selected === 'gallery'}
                    sx={(theme) => ({
                        textTransform: 'none',
                        borderColor: theme.palette.primary.main,
                        backgroundColor: selected === 'gallery' ? theme.palette.primary.main : undefined,
                        color: selected === 'gallery' ? theme.palette.primary.contrastText : theme.palette.primary.main,
                        '&:hover': selected === 'gallery' ? { backgroundColor: theme.palette.primary.dark } : undefined,
                    })}
                >
                    <ImageMultiple sx={{ mr: 1 }} />
                    Gallery
                </Button>
            </ButtonGroup>
        </Box>
    );
};

export default PageSelector;
