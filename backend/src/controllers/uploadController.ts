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
        console.log('Gelen form verileri:', req.body);
        console.log('Gelen dosyalar:', req.files);

        if (!req.files || !req.files.file) {
            throw new Error('Dosya bulunamadı');
        }

        const file = req.files.file as UploadedFile;
        console.log('Yüklenen dosya:', file.name, file.mimetype);

        // Dosya tipi kontrolü
        if (!file.mimetype.startsWith('image/')) {
            console.log('Geçersiz dosya tipi:', file.mimetype);
            throw new Error('Sadece resim dosyaları yüklenebilir');
        }

        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
        }

        const safeFileName = sanitizeFileName(file.name);
        const fileName = `company-logo-${Date.now()}-${safeFileName}`;
        console.log('Oluşturulan dosya adı:', fileName);

        try {
            // Windows'ta dosya yolunu düzelt
            const normalizedPath = path.normalize(file.tempFilePath);
            console.log('Dosya yolu:', normalizedPath);

            // Dosya boyutunu kontrol et
            const stats = await fs.stat(normalizedPath);
            console.log('Dosya boyutu:', stats.size);

            // Dosyayı oku
            const fileContent = await fs.readFile(normalizedPath);
            console.log('Okunan dosya boyutu:', fileContent.length);

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

            console.log('Dosya yükleme başarılı:', uploadData);

            // Public URL'i al
            const { data: { publicUrl } } = adminSupabase.storage
                .from('company-logos')
                .getPublicUrl(fileName);

            console.log('Oluşturulan public URL:', publicUrl);
            console.log('Public URL tipi:', typeof publicUrl);

            // Yanıtı hazırla
            const response = {
                success: true,
                data: {
                    url: publicUrl,
                    fileName: fileName
                }
            };

            console.log('Gönderilecek yanıt:', JSON.stringify(response, null, 2));
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