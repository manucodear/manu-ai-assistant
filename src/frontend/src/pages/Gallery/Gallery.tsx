import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import PageSelector from '../../components/PageSelector';
import ImageGallery from '../../components/ImageGallery/ImageGallery';

const Gallery: React.FC = () => {
	return (
		<Container maxWidth={'lg'} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1 }, p: { xs: 1, md: 1 } }}>
			{/* Page selector with "Gallery" selected */}
			<PageSelector initial="gallery" />

			{/* Gallery content */}
			<Box sx={{ width: '100%' }}>
				<ImageGallery />
			</Box>
		</Container>
	);
};

export default Gallery;
