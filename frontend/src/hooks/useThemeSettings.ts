import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ThemeSettings } from '../theme/createDynamicTheme';

const defaultSettings: ThemeSettings = {
    name: '',
    colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        accent: '#f50057',
        background: '#ffffff',
        text: '#000000',
        header: '#1976d2',
        footer: '#1976d2',
        buttons: {
            primary: '#1976d2',
            secondary: '#dc004e'
        }
    },
    typography: {
        mainFont: 'Roboto, sans-serif',
        sizes: {
            h1: '2.5rem',
            h2: '2rem',
            h3: '1.75rem',
            h4: '1.5rem',
            h5: '1.25rem',
            h6: '1rem'
        }
    },
    layout: {
        maxWidth: '1200px',
        spacing: '1rem',
        containerPadding: '1rem'
    },
    product_card: {
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowSize: '0 2px 8px',
        imageHeight: '200px',
        spacing: '12px'
    },
    product_grid: {
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

export const useThemeSettings = () => {
    const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('theme_settings')
                .select('*')
                .single();

            if (error) throw error;

            if (data) {
                setSettings({
                    ...defaultSettings,
                    ...data,
                });
            }
        } catch (err) {
            setError(err.message);
            console.error('Tema ayarları yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = (newSettings: Partial<ThemeSettings>) => {
        setSettings(prev => ({
            ...prev,
            ...newSettings,
        }));
    };

    const saveSettings = async () => {
        if (!settings) return;

        try {
            const { error } = await supabase
                .from('theme_settings')
                .update(settings)
                .eq('id', settings.id);

            if (error) throw error;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        settings,
        loading,
        error,
        updateSettings,
        saveSettings,
    };
}; 