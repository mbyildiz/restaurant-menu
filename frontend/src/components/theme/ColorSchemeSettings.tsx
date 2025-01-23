import React from 'react';
import { Box, Grid, TextField } from '@mui/material';
import { ThemeSettings } from '../../services/themeService';

interface ColorSchemeSettingsProps {
    colors: ThemeSettings['colors'];
    onChange: (colors: ThemeSettings['colors']) => void;
}

const ColorSchemeSettings: React.FC<ColorSchemeSettingsProps> = ({ colors, onChange }) => {
    const handleColorChange = (field: string, subField?: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (subField) {
            onChange({
                ...colors,
                [field]: {
                    ...colors[field as keyof typeof colors],
                    [subField]: event.target.value
                }
            });
        } else {
            onChange({
                ...colors,
                [field]: event.target.value
            });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Ana Renkler */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Ana Renk"
                        value={colors.primary}
                        onChange={handleColorChange('primary')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="İkincil Renk"
                        value={colors.secondary}
                        onChange={handleColorChange('secondary')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Vurgu Rengi"
                        value={colors.accent}
                        onChange={handleColorChange('accent')}
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Sayfa Renkleri */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Arka Plan Rengi"
                        value={colors.background}
                        onChange={handleColorChange('background')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Metin Rengi"
                        value={colors.text}
                        onChange={handleColorChange('text')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Link Rengi"
                        value={colors.link}
                        onChange={handleColorChange('link')}
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Header ve Footer */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Header Arka Plan"
                        value={colors.header}
                        onChange={handleColorChange('header')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Footer Arka Plan"
                        value={colors.footer}
                        onChange={handleColorChange('footer')}
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Buton Renkleri */}
                <Grid item xs={12}>
                    <Box sx={{ fontWeight: 'bold', mb: 1 }}>Buton Renkleri</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Ana Buton"
                        value={colors.buttons.primary}
                        onChange={handleColorChange('buttons', 'primary')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="İkincil Buton"
                        value={colors.buttons.secondary}
                        onChange={handleColorChange('buttons', 'secondary')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Tehlike Butonu"
                        value={colors.buttons.danger}
                        onChange={handleColorChange('buttons', 'danger')}
                        sx={{ mb: 2 }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ColorSchemeSettings; 