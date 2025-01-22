import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { adminSupabase } from '../config/supabaseClient';
import * as fs from 'fs/promises';
import * as path from 'path';

// Dosya adını temizleme fonksiyonu
const sanitizeFileName = (fileName: string): string => {
    // Türkçe karakterleri değiştir
    return fileName
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9.]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.files || !req.files.file) {
            throw new Error('Dosya bulunamadı');
        }

        const file = req.files.file as UploadedFile;

        // Dosya tipi kontrolü
        if (!file.mimetype.startsWith('image/')) {

            throw new Error('Sadece resim dosyaları yüklenebilir');
        }

        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
        }

        const safeFileName = sanitizeFileName(file.name);
        const fileName = `company-logo-${Date.now()}-${safeFileName}`;


        try {
            // Windows'ta dosya yolunu düzelt
            const normalizedPath = path.normalize(file.tempFilePath);


            // Dosya boyutunu kontrol et
            const stats = await fs.stat(normalizedPath);


            // Dosyayı oku
            const fileContent = await fs.readFile(normalizedPath);

            // Resmi yükle
            const { data: uploadData, error: uploadError } = await adminSupabase.storage
                .from('company-logos')
                .upload(fileName, fileContent, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error('Dosya yükleme hatası:', uploadError);
                throw uploadError;
            }



            // Public URL'i al
            const { data: { publicUrl } } = adminSupabase.storage
                .from('company-logos')
                .getPublicUrl(fileName);

            // Yanıtı hazırla
            const response = {
                success: true,
                data: {
                    url: publicUrl,
                    fileName: fileName
                }
            };
            res.status(200).json(response);
        } catch (error) {
            console.error('Dosya yükleme işlemi hatası:', error);
            throw error;
        }
    } catch (error: any) {
        console.error('Upload hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Dosya yüklenirken bir hata oluştu'
        });
    }
}; 