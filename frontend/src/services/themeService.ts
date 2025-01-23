import api from './api';

export interface ThemeSettings {
    id?: string;
    company_id?: string;
    name: string;
    is_active?: boolean;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        link: string;
        header: string;
        footer: string;
        buttons: {
            primary: string;
            secondary: string;
            danger: string;
        }
    };
    typography: {
        mainFont: string;
        headingFont: string;
        sizes: {
            base: string;
            h1: string;
            h2: string;
            h3: string;
            h4: string;
            h5: string;
            h6: string;
            button: string;
            menuItem: string;
        }
    };
    layout: {
        maxWidth: string;
        containerPadding: string;
        sectionSpacing: string;
        gridGap: string;
        margin: string;
    };
    product_card: {
        borderRadius: string;
        padding: string;
        backgroundColor: string;
        shadowColor: string;
        shadowSize: string;
        imageHeight: string;
        spacing: string;
    };
    product_grid: {
        columns: {
            xs: number;
            sm: number;
            md: number;
            lg: number;
        };
        gap: string;
        containerPadding: string;
    };
    components: {
        card: {
            backgroundColor: string;
            shadowEffect: string;
            borderRadius: string;
        };
        button: {
            borderRadius: string;
            padding: string;
            hoverEffect: string;
        };
        input: {
            borderColor: string;
            backgroundColor: string;
            borderRadius: string;
            focusEffect: string;
        };
    };
    navigation: {
        menuBackground: string;
        menuItemHover: string;
        menuFontStyle: string;
        menuItemSpacing: string;
        activeItemStyle: string;
    };
    animations: {
        transitionDuration: string;
        animationSpeed: string;
        hoverEffects: string;
    };
    breakpoints: {
        mobile: string;
        tablet: string;
        desktop: string;
    };
    branding: {
        logoSize: string;
        logoPosition: string;
        brandColors: {
            primary: string;
            secondary: string;
        };
    };
    states: {
        loadingSpinner: string;
        error: string;
        success: string;
        info: string;
    };
    social_media: {
        iconColors: {
            facebook: string;
            twitter: string;
            instagram: string;
        };
        iconSize: string;
        hoverEffects: string;
    };
}

const handleError = (error: any) => {
    console.error('API Hatası:', error);

    if (error.response) {
        // Sunucudan gelen hata
        throw {
            message: error.response.data.error || 'Sunucu hatası',
            details: error.response.data.details,
            status: error.response.status
        };
    } else if (error.request) {
        // İstek yapıldı ama cevap alınamadı
        throw {
            message: 'Sunucuya ulaşılamıyor',
            details: 'Lütfen internet bağlantınızı kontrol edin'
        };
    } else {
        // İstek oluşturulurken hata oluştu
        throw {
            message: 'İstek oluşturulamadı',
            details: error.message
        };
    }
};

const themeService = {
    // Tema ayarlarını getir
    getThemeSettings: async (companyId: string): Promise<ThemeSettings> => {
        try {
            const response = await api.get(`/themes/${companyId}`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Yeni tema ayarı oluştur
    createThemeSettings: async (companyId: string, themeData: Partial<ThemeSettings>): Promise<ThemeSettings> => {
        try {
            const response = await api.post(`/themes/${companyId}`, themeData);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Tema ayarlarını güncelle
    updateThemeSettings: async (companyId: string, themeData: Partial<ThemeSettings> & { id: string }): Promise<ThemeSettings> => {
        try {
            console.log('Güncelleme isteği gönderiliyor:', { companyId, themeData });
            const response = await api.put(`/themes/${companyId}`, themeData);
            console.log('Güncelleme yanıtı:', response.data);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Aktif temayı değiştir
    setActiveTheme: async (companyId: string, themeId: string): Promise<ThemeSettings> => {
        try {
            const response = await api.put(`/themes/${companyId}/active/${themeId}`);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

export default themeService; 