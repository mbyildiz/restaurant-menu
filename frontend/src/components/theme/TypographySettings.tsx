import React from 'react';
import { Box, Grid, TextField, MenuItem } from '@mui/material';
import { ThemeSettings } from '../../services/themeService';

interface TypographySettingsProps {
    typography: ThemeSettings['typography'];
    onChange: (typography: ThemeSettings['typography']) => void;
}

const fontFamilies = [
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Raleway, sans-serif',
    'Ubuntu, sans-serif',
    'Source Sans Pro, sans-serif'
];

const TypographySettings: React.FC<TypographySettingsProps> = ({ typography, onChange }) => {
    const handleChange = (field: string, subField?: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (subField) {
            onChange({
                ...typography,
                sizes: {
                    ...typography.sizes,
                    [subField]: event.target.value
                }
            });
        } else {
            onChange({
                ...typography,
                [field]: event.target.value
            });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                {/* Font Aileleri */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Ana Font"
                        value={typography.mainFont}
                        onChange={handleChange('mainFont')}
                        sx={{ mb: 2 }}
                    >
                        {fontFamilies.map((font) => (
                            <MenuItem key={font} value={font}>
                                {font.split(',')[0]}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Başlık Fontu"
                        value={typography.headingFont}
                        onChange={handleChange('headingFont')}
                        sx={{ mb: 2 }}
                    >
                        {fontFamilies.map((font) => (
                            <MenuItem key={font} value={font}>
                                {font.split(',')[0]}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Font Boyutları */}
                <Grid item xs={12}>
                    <Box sx={{ fontWeight: 'bold', mb: 1 }}>Font Boyutları</Box>
                </Grid>

                {/* Ana Metin Boyutu */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Ana Metin Boyutu"
                        value={typography.sizes.base}
                        onChange={handleChange('sizes', 'base')}
                        placeholder="16px"
                        sx={{ mb: 2 }}
                    />
                </Grid>

                {/* Başlık Boyutları */}
                {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((heading) => (
                    <Grid item xs={12} md={4} key={heading}>
                        <TextField
                            fullWidth
                            label={`${heading.toUpperCase()} Boyutu`}
                            value={typography.sizes[heading as keyof typeof typography.sizes]}
                            onChange={handleChange('sizes', heading)}
                            placeholder={heading === 'h1' ? '2.5rem' : '1rem'}
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                ))}

                {/* Diğer Boyutlar */}
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Buton Metin Boyutu"
                        value={typography.sizes.button}
                        onChange={handleChange('sizes', 'button')}
                        placeholder="1rem"
                        sx={{ mb: 2 }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label="Menü Item Boyutu"
                        value={typography.sizes.menuItem}
                        onChange={handleChange('sizes', 'menuItem')}
                        placeholder="1rem"
                        sx={{ mb: 2 }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default TypographySettings; 