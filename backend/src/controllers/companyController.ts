import { Request, Response } from 'express';
import { CompanyInfoModel } from '../models/CompanyInfo';
import { supabase } from '../config/supabaseClient';
import QRCode from 'qrcode';

const companyInfoModel = new CompanyInfoModel(supabase);

// QR kod oluşturma fonksiyonu
async function generateQRCode(url: string): Promise<string> {
    try {
        console.log('QR Kod oluşturuluyor...');
        console.log('Gelen URL:', url);

        // URL'i düzelt
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        console.log('Düzeltilmiş URL:', fullUrl);

        // QR kod seçenekleri
        const qrOptions = {
            errorCorrectionLevel: 'H' as const,
            type: 'image/png' as const,
            margin: 1,
            width: 250
        };

        return new Promise((resolve, reject) => {
            QRCode.toDataURL(fullUrl, qrOptions, (err, url) => {
                if (err) {
                    console.error('QR kod oluşturma hatası:', err);
                    reject(err);
                    return;
                }
                console.log('QR Kod başarıyla oluşturuldu, uzunluk:', url.length);
                resolve(url);
            });
        });
    } catch (error) {
        console.error('QR kod oluşturma hatası:', error);
        throw error;
    }
}

export const createCompanyInfo = async (req: Request, res: Response) => {
    try {
        const companyInfo = await companyInfoModel.create(req.body);
        res.status(201).json(companyInfo);
    } catch (error: any) {
        console.error('Create Company Info Error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const updateCompanyInfo = async (req: Request, res: Response) => {
    try {
        console.log('=== Update İsteği Başlıyor ===');
        console.log('1. Params:', req.params);
        console.log('2. Body:', JSON.stringify(req.body, null, 2));

        const { id } = req.params;

        if (!id) {
            console.error('3. Hata: ID parametresi eksik');
            return res.status(400).json({ error: 'ID parametresi bulunamadı' });
        }

        // Zorunlu alanların kontrolü
        const requiredFields = ['company_name', 'company_address', 'phone_number'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.error(`4. Hata: ${field} alanı eksik`);
                return res.status(400).json({ error: `${field} alanı zorunludur` });
            }
        }

        const website = req.body.website?.trim();

        // Güncellenecek veriyi hazırla
        const updateData: {
            company_name: string;
            company_address: string;
            phone_number: string;
            website: string | null;
            social_media: any;
            logo_url: string | null;
            qr_code: string | null;
            updated_at: string;
        } = {
            company_name: req.body.company_name.trim(),
            company_address: req.body.company_address.trim(),
            phone_number: req.body.phone_number.trim(),
            website: website || null,
            social_media: req.body.social_media || {},
            logo_url: req.body.logo_url || null,
            qr_code: null,
            updated_at: new Date().toISOString()
        };

        // Website varsa QR kod oluştur
        if (website) {
            try {
                console.log('5. Website bulundu:', website);
                const qrCode = await generateQRCode(website);
                console.log('6. QR kod oluşturuldu, uzunluk:', qrCode.length);
                updateData.qr_code = qrCode;
            } catch (qrError) {
                console.error('7. QR kod oluşturma hatası:', qrError);
                updateData.qr_code = null;
            }
        } else {
            console.log('5. Website bulunamadı, QR kod temizleniyor');
            updateData.qr_code = null;
        }

        console.log('8. Güncellenecek veri:', {
            ...updateData,
            qr_code: updateData.qr_code ? `QR Kod var (${updateData.qr_code.length} karakter)` : 'QR Kod yok'
        });

        // Doğrudan Supabase'e gönderelim
        const { data, error } = await supabase
            .from('company_info')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('9. Güncelleme hatası:', error);
            throw new Error('Firma bilgileri güncellenirken hata oluştu');
        }

        if (!data) {
            throw new Error('Güncelleme sonrası veri bulunamadı');
        }

        console.log('10. Güncelleme başarılı:', {
            ...data,
            qr_code: data.qr_code ? `QR Kod var (${data.qr_code.length} karakter)` : 'QR Kod yok'
        });
        console.log('=== Update İsteği Tamamlandı ===');

        return res.status(200).json(data);
    } catch (error: any) {
        console.error('Update Company Info Error:', {
            message: error.message,
            stack: error.stack
        });

        let statusCode = 400;
        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
        } else if (error.message.includes('yetkiniz yok')) {
            statusCode = 403;
        }

        return res.status(statusCode).json({ error: error.message });
    }
};

export const getCompanyInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Firma Bilgileri İstendi ===');
        const { data: companyInfo, error } = await supabase
            .from('company_info')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('1. Veri çekme hatası:', error);
            throw error;
        }

        if (!companyInfo) {
            console.log('2. Firma bilgisi bulunamadı');
            res.status(404).json({ error: 'Firma bilgisi bulunamadı' });
            return;
        }

        console.log('3. Alınan firma bilgileri:', {
            ...companyInfo,
            qr_code: companyInfo.qr_code ? 'QR Kod var' : 'QR Kod yok'
        });

        // Website varsa ve QR kod yoksa, QR kodu oluştur
        if (companyInfo.website && !companyInfo.qr_code) {
            try {
                console.log('4. Website var ama QR kod yok, oluşturuluyor...');
                const qrCode = await generateQRCode(companyInfo.website);
                console.log('5. QR kod oluşturuldu, veritabanına kaydediliyor...');

                // QR kodu veritabanına kaydet
                const { data: updatedData, error: updateError } = await supabase
                    .from('company_info')
                    .update({ qr_code: qrCode })
                    .eq('id', companyInfo.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('6. QR kod kaydetme hatası:', updateError);
                } else {
                    console.log('7. QR kod başarıyla kaydedildi');
                    companyInfo.qr_code = qrCode;
                }
            } catch (qrError) {
                console.error('8. QR kod oluşturma hatası:', qrError);
            }
        }

        console.log('9. Gönderilecek firma bilgileri:', {
            ...companyInfo,
            qr_code: companyInfo.qr_code ? 'QR Kod var' : 'QR Kod yok'
        });

        res.status(200).json(companyInfo);
        return;
    } catch (error: any) {
        console.error('Get Company Info Error:', error);
        const statusCode = error.message.includes('bulunamadı') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
        return;
    }
};