import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Tab,
    Tabs,
    Typography,
    Button,
    TextField,
    Snackbar,
    Alert,
    useTheme,
    CircularProgress
} from '@mui/material';
import { useParams } from 'react-router-dom';
import ColorSchemeSettings from '../components/theme/ColorSchemeSettings';
import TypographySettings from '../components/theme/TypographySettings';
import LayoutSettings from '../components/theme/LayoutSettings';
import themeService, { ThemeSettings } from '../services/themeService';
import api from '../services/api';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { ProductCardSettings } from '../components/theme/ProductCardSettings';
import { ProductGridSettings } from '../components/theme/ProductGridSettings';
import { useThemeSettings } from '../hooks/useThemeSettings';
import { toast } from 'react-hot-toast';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`theme-tabpanel-${index}`}
            aria-labelledby={`theme-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ThemeSettingsPage: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const { themeSettings: appThemeSettings, updateTheme } = useAppTheme();
    const { settings, loading, error, updateSettings, saveSettings } = useThemeSettings();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (companyId) {
            loadThemeSettings();
        }
    }, [companyId]);

    const loadThemeSettings = async () => {
        try {
            const data = await themeService.getThemeSettings(companyId!);
            updateSettings(data);
        } catch (error) {
            console.error('Tema ayarları yüklenirken hata:', error);
            setSnackbar({
                open: true,
                message: 'Tema ayarları yüklenirken bir hata oluştu',
                severity: 'error'
            });
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleColorChange = (colors: ThemeSettings['colors']) => {
        updateSettings({ colors });

        // Anlık önizleme için tema değişikliklerini uygula
        document.documentElement.style.setProperty('--primary-color', colors.primary);
        document.documentElement.style.setProperty('--secondary-color', colors.secondary);
        document.documentElement.style.setProperty('--accent-color', colors.accent);
        document.documentElement.style.setProperty('--background-color', colors.background);
        document.documentElement.style.setProperty('--text-color', colors.text);
        document.documentElement.style.setProperty('--header-bg', colors.header);
        document.documentElement.style.setProperty('--footer-bg', colors.footer);
    };

    const handleTypographyChange = (typography: ThemeSettings['typography']) => {
        updateSettings({ typography });
    };

    const handleLayoutChange = (layout: ThemeSettings['layout']) => {
        updateSettings({ layout });
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setIsLoading(true);
            // Önce ayarları kaydet
            const savedSettings = await saveSettings();

            // Sonra temayı güncelle
            if (updateTheme && savedSettings) {
                await updateTheme({
                    ...savedSettings,
                    is_active: true // Aktif tema olarak işaretle
                });
            }

            setSnackbar({
                open: true,
                message: 'Tema ayarları başarıyla kaydedildi',
                severity: 'success'
            });
        } catch (error) {
            console.error('Tema kaydedilirken hata:', error);
            setSnackbar({
                open: true,
                message: 'Tema kaydedilirken bir hata oluştu',
                severity: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleThemeUpdate = async (updatedTheme: ThemeSettings) => {
        try {
            setIsLoading(true);
            await updateTheme({
                ...updatedTheme,
                is_active: true // Aktif tema olarak işaretle
            });
            toast.success('Tema başarıyla güncellendi');
        } catch (error) {
            console.error('Tema güncellenirken hata:', error);
            toast.error('Tema güncellenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || !settings) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        Tema Ayarları
                    </Typography>
                    <TextField
                        fullWidth
                        label="Tema Adı"
                        value={settings.name || ''}
                        onChange={(e) => updateSettings({ name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Renk Şeması" />
                        <Tab label="Tipografi" />
                        <Tab label="Düzen" />
                        <Tab label="Ürün Kartı" />
                        <Tab label="Ürün Gridi" />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <ColorSchemeSettings
                        colors={settings.colors}
                        onChange={handleColorChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <TypographySettings
                        typography={settings.typography}
                        onChange={handleTypographyChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <LayoutSettings
                        layout={settings.layout}
                        onChange={handleLayoutChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <ProductCardSettings
                        settings={settings}
                        onUpdate={updateSettings}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={4}>
                    <ProductGridSettings
                        settings={settings}
                        onUpdate={updateSettings}
                    />
                </TabPanel>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        Değişiklikleri Kaydet
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ThemeSettingsPage; 