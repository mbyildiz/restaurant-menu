import React from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';
import { ThemeSettings } from '../../services/themeService';

interface LayoutSettingsProps {
    layout: ThemeSettings['layout'];
    onChange: (layout: ThemeSettings['layout']) => void;
}

const LayoutSettings: React.FC<LayoutSettingsProps> = ({ layout, onChange }) => {
    const handleChange = (field: keyof ThemeSettings['layout']) => (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...layout,
            [field]: event.target.value
        });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Sayfa Genişliği */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Maksimum Genişlik"
                        value={layout.maxWidth}
                        onChange={handleChange('maxWidth')}
                        placeholder="1200px"
                        helperText="Sayfanın maksimum genişliği (örn: 1200px)"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Container Padding */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Container Padding"
                        value={layout.containerPadding}
                        onChange={handleChange('containerPadding')}
                        placeholder="1rem"
                        helperText="İçerik kenar boşluğu (örn: 1rem)"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Section Spacing */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Bölüm Aralığı"
                        value={layout.sectionSpacing}
                        onChange={handleChange('sectionSpacing')}
                        placeholder="2rem"
                        helperText="Bölümler arası boşluk (örn: 2rem)"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Grid Gap */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Grid Aralığı"
                        value={layout.gridGap}
                        onChange={handleChange('gridGap')}
                        placeholder="1rem"
                        helperText="Grid öğeleri arası boşluk (örn: 1rem)"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Margin */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Kenar Boşluğu"
                        value={layout.margin}
                        onChange={handleChange('margin')}
                        placeholder="1rem"
                        helperText="Genel kenar boşluğu (örn: 1rem)"
                        sx={{ mb: 2 }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                    Not: Tüm ölçüler için px, rem, em, % gibi birimler kullanabilirsiniz.
                </Typography>
            </Box>
        </Box>
    );
};

export default LayoutSettings; 