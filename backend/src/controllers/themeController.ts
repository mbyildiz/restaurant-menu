import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const ThemeController = {
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

            // Sadece gerekli alanları güncelle
            const updateData = {
                name: themeData.name,
                colors: themeData.colors,
                typography: themeData.typography,
                layout: themeData.layout,
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

            // Önce temanın varlığını ve sahipliğini kontrol et
            const { data: existingTheme, error: checkError } = await supabase
                .from('theme_settings')
                .select('id')
                .eq('id', theme_id)
                .eq('company_id', company_id)
                .single();

            if (checkError || !existingTheme) {
                return res.status(404).json({ error: 'Tema bulunamadı' });
            }

            // Önce tüm temaları pasif yap
            await supabase
                .from('theme_settings')
                .update({ is_active: false })
                .eq('company_id', company_id);

            // Seçilen temayı aktif et
            const { data, error } = await supabase
                .from('theme_settings')
                .update({ is_active: true })
                .eq('id', theme_id)
                .eq('company_id', company_id)
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Tema aktivasyon hatası:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}; 