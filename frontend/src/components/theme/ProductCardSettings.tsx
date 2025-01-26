import React from 'react';
import { Box, Typography, Slider, TextField, Grid } from '@mui/material';
import { ThemeSettings } from '../../theme/createDynamicTheme';

interface ProductCardSettingsProps {
    settings: ThemeSettings;
    onUpdate: (settings: Partial<ThemeSettings>) => void;
}

export const ProductCardSettings: React.FC<ProductCardSettingsProps> = ({
    settings,
    onUpdate,
}) => {
    const handleChange = (field: keyof typeof settings.product_card, value: string) => {
        onUpdate({
            product_card: {
                ...settings.product_card,
                [field]: value
            }
        });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Ürün Kartı Ayarları
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Kenar Yuvarlaklığı"
                        value={settings.product_card.borderRadius}
                        onChange={(e) => handleChange('borderRadius', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="İç Boşluk"
                        value={settings.product_card.padding}
                        onChange={(e) => handleChange('padding', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Arkaplan Rengi"
                        value={settings.product_card.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        type="color"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Gölge Rengi"
                        value={settings.product_card.shadowColor}
                        onChange={(e) => handleChange('shadowColor', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Gölge Boyutu"
                        value={settings.product_card.shadowSize}
                        onChange={(e) => handleChange('shadowSize', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Resim Yüksekliği"
                        value={settings.product_card.imageHeight}
                        onChange={(e) => handleChange('imageHeight', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Ürün Aralığı"
                        value={settings.product_card.spacing}
                        onChange={(e) => handleChange('spacing', e.target.value)}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}; 