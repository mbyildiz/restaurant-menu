import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            throw new Error('Dosya bulunamadı');
        }

        const file = req.file;
        const fileName = `company-logo-${Date.now()}-${Math.random().toString(36).substring(7)}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

        // Dosyayı Supabase storage'a yükle
        const { data, error } = await supabase.storage
            .from('company-logos')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Dosya yükleme hatası:', error);
            throw error;
        }

        // Public URL'i al
        const { data: { publicUrl } } = supabase.storage
            .from('company-logos')
            .getPublicUrl(fileName);

        res.status(200).json({ url: publicUrl });
    } catch (error: any) {
        console.error('Upload hatası:', error);
        res.status(500).json({ error: error.message || 'Dosya yüklenirken bir hata oluştu' });
    }
}; 