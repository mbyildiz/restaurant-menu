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
    useTheme
} from '@mui/material';
import { useParams } from 'react-router-dom';
import ColorSchemeSettings from '../components/theme/ColorSchemeSettings';
import TypographySettings from '../components/theme/TypographySettings';
import LayoutSettings from '../components/theme/LayoutSettings';
import themeService, { ThemeSettings } from '../services/themeService';
import api from '../services/api';
import { useTheme as useAppTheme } from '../context/ThemeContext';

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
    const [themeName, setThemeName] = useState('');
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const { themeSettings: appThemeSettings, updateTheme } = useAppTheme();

    useEffect(() => {
        if (companyId) {
            loadThemeSettings();
        }
    }, [companyId]);

    const loadThemeSettings = async () => {
        try {
            const data = await themeService.getThemeSettings(companyId!);
            setThemeSettings(data);
            setThemeName(data.name);
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
        if (!themeSettings) return;

        const updatedSettings = {
            ...themeSettings,
            colors
        };
        setThemeSettings(updatedSettings);

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
        if (themeSettings) {
            setThemeSettings({ ...themeSettings, typography });
        }
    };

    const handleLayoutChange = (layout: ThemeSettings['layout']) => {
        if (themeSettings) {
            setThemeSettings({ ...themeSettings, layout });
        }
    };

    const handleSave = async () => {
        if (!themeSettings) return;

        try {
            const updatedThemeSettings = {
                ...themeSettings,
                name: themeName
            };
            await api.put(`/themes/${companyId}`, updatedThemeSettings);
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
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleThemeUpdate = async (updatedTheme: ThemeSettings) => {
        try {
            const response = await themeService.updateThemeSettings(updatedTheme.company_id, updatedTheme);
            updateTheme(response.data);
            // Başarı mesajı göster
        } catch (error) {
            console.error('Tema güncellenirken hata:', error);
            // Hata mesajı göster
        }
    };

    if (!themeSettings) {
        return (
            <Container>
                <Typography>Yükleniyor...</Typography>
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
                        value={themeName}
                        onChange={(e) => setThemeName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Renk Şeması" />
                        <Tab label="Tipografi" />
                        <Tab label="Düzen" />
                        {/* Diğer sekmeler buraya eklenecek */}
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <ColorSchemeSettings
                        colors={themeSettings.colors}
                        onChange={handleColorChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <TypographySettings
                        typography={themeSettings.typography}
                        onChange={handleTypographyChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <LayoutSettings
                        layout={themeSettings.layout}
                        onChange={handleLayoutChange}
                    />
                </TabPanel>
                {/* Diğer sekme panelleri buraya eklenecek */}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                    >
                        Kaydet
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