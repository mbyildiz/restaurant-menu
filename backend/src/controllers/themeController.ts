import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const ThemeController = {
    // Aktif temayı getir
    getActiveTheme: async (req: Request, res: Response) => {
        try {
            const { data, error } = await supabase
                .from('theme_settings')
                .select('*')
                .eq('is_active', true)
                .single();

            if (error) throw error;

            if (!data) {
                // Aktif tema yoksa varsayılan tema ayarlarını döndür
                return res.status(200).json({
                    id: 'default',
                    company_id: 'default',
                    name: 'Varsayılan Tema',
                    is_active: true,
                    colors: {
                        primary: '#2E7D32',
                        secondary: '#FF5722',
                        accent: '#1976D2',
                        background: '#F8F9FA',
                        text: '#2C3E50',
                        link: '#1976D2',
                        header: '#FFFFFF',
                        footer: '#F8F9FA',
                        buttons: {
                            primary: '#2E7D32',
                            secondary: '#FF5722',
                            danger: '#DC3545'
                        }
                    },
                    typography: {
                        mainFont: 'Roboto, sans-serif',
                        headingFont: 'Roboto, sans-serif',
                        sizes: {
                            base: '16px',
                            h1: '2.5rem',
                            h2: '2rem',
                            h3: '1.75rem',
                            h4: '1.5rem',
                            h5: '1.25rem',
                            h6: '1rem',
                            button: '1rem',
                            menuItem: '1rem'
                        }
                    },
                    layout: {
                        maxWidth: '1200px',
                        containerPadding: '1rem',
                        sectionSpacing: '2rem',
                        gridGap: '1rem',
                        margin: '1rem'
                    },
                    components: {
                        card: {
                            backgroundColor: '#FFFFFF',
                            shadowEffect: '0 2px 4px rgba(0,0,0,0.1)',
                            borderRadius: '8px'
                        },
                        button: {
                            borderRadius: '4px',
                            padding: '0.5rem 1rem',
                            hoverEffect: 'brightness(0.95)'
                        },
                        input: {
                            borderColor: '#E2E8F0',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '4px',
                            focusEffect: 'border-color: #3182CE'
                        }
                    },
                    navigation: {
                        menuBackground: '#FFFFFF',
                        menuItemHover: '#F7FAFC',
                        menuFontStyle: 'normal',
                        menuItemSpacing: '0.5rem',
                        activeItemStyle: 'bold'
                    },
                    animations: {
                        transitionDuration: '0.2s',
                        animationSpeed: '0.3s',
                        hoverEffects: 'ease-in-out'
                    },
                    breakpoints: {
                        mobile: '320px',
                        tablet: '768px',
                        desktop: '1024px'
                    },
                    branding: {
                        logoSize: '120px',
                        logoPosition: 'left',
                        brandColors: {
                            primary: '#2E7D32',
                            secondary: '#FF5722'
                        }
                    },
                    states: {
                        loadingSpinner: '#2E7D32',
                        error: '#DC3545',
                        success: '#28A745',
                        info: '#17A2B8'
                    },
                    social_media: {
                        iconColors: {
                            facebook: '#1877F2',
                            twitter: '#1DA1F2',
                            instagram: '#E4405F'
                        },
                        iconSize: '24px',
                        hoverEffects: 'scale(1.1)'
                    }
                });
            }

            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Tema ayarlarını getir
    getThemeSettings: async (req: Request, res: Response) => {
        try {
            const { company_id } = req.params;

            const { data, error } = await supabase
                .from('theme_settings')
                .select('*')
                .eq('company_id', company_id)
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Yeni tema ayarı oluştur
    createThemeSettings: async (req: Request, res: Response) => {
        try {
            const { company_id } = req.params;
            const themeData = req.body;

            // Tema adı kontrolü
            if (!themeData.name?.trim()) {
                return res.status(400).json({ error: 'Tema adı zorunludur' });
            }

            const { data, error } = await supabase
                .from('theme_settings')
                .insert([{ ...themeData, company_id }])
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Tema ayarlarını güncelle
    updateThemeSettings: async (req: Request, res: Response) => {
        try {
            const { company_id } = req.params;
            const { id, ...themeData } = req.body;

            console.log('Güncelleme isteği:', {
                company_id,
                id,
                themeDataKeys: Object.keys(themeData)
            });

            // Basit validasyonlar
            if (!id) {
                return res.status(400).json({ error: 'Tema ID zorunludur' });
            }

            // Tüm tema verilerini güncelle
            const updateData = {
                name: themeData.name,
                colors: themeData.colors,
                typography: themeData.typography,
                layout: themeData.layout,
                components: themeData.components,
                navigation: themeData.navigation,
                animations: themeData.animations,
                breakpoints: themeData.breakpoints,
                branding: themeData.branding,
                states: themeData.states,
                social_media: themeData.social_media,
                updated_at: new Date().toISOString()
            };

            console.log('Güncellenecek veri:', JSON.stringify(updateData, null, 2));

            // Güncelleme işlemi
            const { data, error } = await supabase
                .from('theme_settings')
                .update(updateData)
                .match({ id: id })
                .select()
                .single();

            // Hata kontrolü
            if (error) {
                console.error('Supabase güncelleme hatası:', error);
                return res.status(500).json({
                    error: 'Tema güncellenirken hata oluştu',
                    details: error.message,
                    code: error.code
                });
            }

            // Veri kontrolü
            if (!data) {
                return res.status(404).json({
                    error: 'Tema güncellenemedi',
                    details: 'Güncellenecek tema bulunamadı'
                });
            }

            console.log('Güncelleme başarılı:', data);
            return res.status(200).json(data);

        } catch (error: any) {
            console.error('Beklenmeyen hata:', error);
            return res.status(500).json({
                error: 'Beklenmeyen bir hata oluştu',
                details: error.message || 'Detay bilgisi yok'
            });
        }
    },

    // Aktif temayı değiştir
    setActiveTheme: async (req: Request, res: Response) => {
        try {
            const { company_id, theme_id } = req.params;

            // Önce tüm temaları inaktif yap
            await supabase
                .from('theme_settings')
                .update({ is_active: false })
                .eq('company_id', company_id);

            // Seçilen temayı aktif yap
            const { data, error } = await supabase
                .from('theme_settings')
                .update({ is_active: true })
                .eq('id', theme_id)
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}; 