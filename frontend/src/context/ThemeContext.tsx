import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeSettings } from '../services/themeService';
import api from '../services/api';

interface ThemeContextType {
    themeSettings: ThemeSettings | null;
    updateTheme: (newTheme: ThemeSettings) => Promise<void>;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchActiveTheme = async () => {
        try {
            const response = await api.get('/themes/active');
            if (response.data) {
                setThemeSettings(response.data);
            }
        } catch (error) {
            console.error('Tema yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveTheme();
    }, []);

    const updateTheme = async (newTheme: ThemeSettings) => {
        try {
            setLoading(true);
            // Önce API'ye gönder
            const response = await api.put(`/themes/${newTheme.company_id}`, newTheme);

            if (response.data) {
                // Başarılı olursa state'i güncelle
                setThemeSettings(response.data);

                // Aktif tema ise anında uygula
                if (newTheme.is_active) {
                    await fetchActiveTheme();
                }
            }
        } catch (error) {
            console.error('Tema güncellenirken hata:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeContext.Provider value={{ themeSettings, updateTheme, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}; 