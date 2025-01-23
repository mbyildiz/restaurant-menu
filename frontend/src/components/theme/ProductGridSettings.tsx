import React from 'react';
import { Box, Typography, Slider, TextField, Grid } from '@mui/material';
import { ThemeSettings } from '../../theme/createDynamicTheme';

interface ProductGridSettingsProps {
    settings: ThemeSettings;
    onUpdate: (settings: Partial<ThemeSettings>) => void;
}

export const ProductGridSettings: React.FC<ProductGridSettingsProps> = ({
    settings,
    onUpdate,
}) => {
    const handleColumnChange = (breakpoint: keyof typeof settings.product_grid.columns, value: number) => {
        onUpdate({
            product_grid: {
                ...settings.product_grid,
                columns: {
                    ...settings.product_grid.columns,
                    [breakpoint]: value
                }
            }
        });
    };

    const handleChange = (field: 'gap' | 'containerPadding', value: string) => {
        onUpdate({
            product_grid: {
                ...settings.product_grid,
                [field]: value
            }
        });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Ürün Grid Ayarları
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Mobil Sütun Sayısı (xs)</Typography>
                    <Slider
                        value={settings.product_grid.columns.xs}
                        onChange={(_, value) => handleColumnChange('xs', value as number)}
                        min={1}
                        max={4}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Tablet Sütun Sayısı (sm)</Typography>
                    <Slider
                        value={settings.product_grid.columns.sm}
                        onChange={(_, value) => handleColumnChange('sm', value as number)}
                        min={1}
                        max={4}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Küçük Masaüstü Sütun Sayısı (md)</Typography>
                    <Slider
                        value={settings.product_grid.columns.md}
                        onChange={(_, value) => handleColumnChange('md', value as number)}
                        min={1}
                        max={6}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Büyük Masaüstü Sütun Sayısı (lg)</Typography>
                    <Slider
                        value={settings.product_grid.columns.lg}
                        onChange={(_, value) => handleColumnChange('lg', value as number)}
                        min={1}
                        max={6}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Grid Boşluğu"
                        value={settings.product_grid.gap}
                        onChange={(e) => handleChange('gap', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Konteyner İç Boşluğu"
                        value={settings.product_grid.containerPadding}
                        onChange={(e) => handleChange('containerPadding', e.target.value)}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}; 