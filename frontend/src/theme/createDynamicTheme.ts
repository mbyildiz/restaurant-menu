import { createTheme } from '@mui/material/styles';
import { ThemeSettings } from '../services/themeService';

export const createDynamicTheme = (themeSettings: ThemeSettings) => {
    return createTheme({
        palette: {
            primary: {
                main: themeSettings.colors.primary,
            },
            secondary: {
                main: themeSettings.colors.secondary,
            },
            background: {
                default: themeSettings.colors.background,
                paper: '#FFFFFF',
            },
            text: {
                primary: themeSettings.colors.text,
            },
        },
        typography: {
            fontFamily: themeSettings.typography.mainFont,
            h1: { fontSize: themeSettings.typography.sizes.h1 },
            h2: { fontSize: themeSettings.typography.sizes.h2 },
            h3: { fontSize: themeSettings.typography.sizes.h3 },
            h4: { fontSize: themeSettings.typography.sizes.h4 },
            h5: { fontSize: themeSettings.typography.sizes.h5 },
            h6: { fontSize: themeSettings.typography.sizes.h6 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        backgroundColor: themeSettings.colors.buttons.primary,
                        '&:hover': {
                            backgroundColor: themeSettings.colors.buttons.secondary,
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: themeSettings.colors.header,
                        color: themeSettings.colors.text,
                    },
                },
            },
            MuiToolbar: {
                styleOverrides: {
                    root: {
                        backgroundColor: themeSettings.colors.header,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: themeSettings.product_card?.backgroundColor || '#ffffff',
                        borderRadius: themeSettings.product_card?.borderRadius || '8px',
                        padding: themeSettings.product_card?.padding || '16px',
                        boxShadow: `${themeSettings.product_card?.shadowSize || '0 2px 8px'} ${themeSettings.product_card?.shadowColor || 'rgba(0, 0, 0, 0.1)'}`,
                    },
                },
            },
            MuiGrid: {
                styleOverrides: {
                    root: {
                        '& .product-grid': {
                            gap: themeSettings.product_grid?.gap || '24px',
                            padding: themeSettings.product_grid?.containerPadding || '24px',
                        },
                    },
                },
            },
            MuiPaper: {
                variants: [
                    {
                        props: { variant: 'header' },
                        style: {
                            backgroundColor: themeSettings.colors.header,
                        },
                    },
                ],
            },
        },
    });
};

export interface ThemeSettings {
    // ... existing code ...
    productCard: {
        borderRadius: string;
        padding: string;
        backgroundColor: string;
        shadowColor: string;
        shadowSize: string;
        imageHeight: string;
        spacing: string;
    };
    productGrid: {
        columns: {
            xs: number;
            sm: number;
            md: number;
            lg: number;
        };
        gap: string;
        containerPadding: string;
    };
}

export const defaultThemeSettings: ThemeSettings = {
    // ... existing code ...
    productCard: {
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowSize: '0 2px 8px',
        imageHeight: '200px',
        spacing: '12px'
    },
    productGrid: {
        columns: {
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4
        },
        gap: '24px',
        containerPadding: '24px'
    }
};