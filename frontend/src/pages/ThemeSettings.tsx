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
    Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import ColorSchemeSettings from '../components/theme/ColorSchemeSettings';
import TypographySettings from '../components/theme/TypographySettings';
import LayoutSettings from '../components/theme/LayoutSettings';
import themeService, { ThemeSettings } from '../services/themeService';

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
        if (themeSettings) {
            setThemeSettings({ ...themeSettings, colors });
        }
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
        try {
            if (!themeSettings) return;

            if (!themeName.trim()) {
                setSnackbar({
                    open: true,
                    message: 'Tema adı boş olamaz',
                    severity: 'error'
                });
                return;
            }

            const updatedTheme = {
                ...themeSettings,
                name: themeName
            };

            console.log('Kaydetme işlemi başlatılıyor:', updatedTheme);

            let response;
            if (themeSettings.id) {
                // Mevcut temayı güncelle
                console.log('Mevcut tema güncelleniyor...');
                response = await themeService.updateThemeSettings(companyId!, {
                    id: themeSettings.id,
                    ...updatedTheme
                });
            } else {
                // Yeni tema oluştur
                console.log('Yeni tema oluşturuluyor...');
                response = await themeService.createThemeSettings(companyId!, updatedTheme);
            }

            console.log('İşlem başarılı:', response);
            setThemeSettings(response);
            setSnackbar({
                open: true,
                message: 'Tema ayarları başarıyla kaydedildi',
                severity: 'success'
            });
        } catch (error: any) {
            console.error('Tema ayarları kaydedilirken hata:', error);

            let errorMessage = 'Tema ayarları kaydedilirken bir hata oluştu';
            if (error.message) {
                errorMessage = error.message;
            }

            let details = '';
            if (error.details) {
                details = typeof error.details === 'string' ? error.details : JSON.stringify(error.details);
            }

            setSnackbar({
                open: true,
                message: `${errorMessage}${details ? `\nDetay: ${details}` : ''}`,
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
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