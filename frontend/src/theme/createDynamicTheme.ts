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