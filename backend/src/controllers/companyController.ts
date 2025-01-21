import { Request, Response } from 'express';
import { CompanyInfoModel } from '../models/CompanyInfo';
import { adminSupabase } from '../config/supabaseClient';
import QRCode from 'qrcode';

const companyInfoModel = new CompanyInfoModel(adminSupabase);

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
        const updateData = req.body;
        console.log('Gelen güncelleme verisi:', updateData);

        // İlk kaydı bul
        const { data: firstCompany, error: fetchError } = await adminSupabase
            .from('company_info')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (fetchError) {
            console.error('İlk kayıt bulunurken hata:', fetchError);
            return res.status(500).json({ error: 'Firma bilgisi bulunamadı' });
        }

        // Diğer tüm kayıtları sil
        const { error: deleteError } = await adminSupabase
            .from('company_info')
            .delete()
            .neq('id', firstCompany.id);

        if (deleteError) {
            console.error('Eski kayıtlar silinirken hata:', deleteError);
            return res.status(500).json({ error: 'Eski kayıtlar silinirken hata oluştu' });
        }

        // İlk kaydı güncelle
        const { data: updatedCompany, error: updateError } = await adminSupabase
            .from('company_info')
            .update(updateData)
            .eq('id', firstCompany.id)
            .select()
            .single();

        if (updateError) {
            console.error('Güncelleme hatası:', updateError);
            return res.status(500).json({ error: 'Firma bilgileri güncellenirken hata oluştu' });
        }

        console.log('Güncellenen firma bilgisi:', updatedCompany);
        return res.status(200).json(updatedCompany);
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        return res.status(500).json({ error: 'Firma bilgileri güncellenirken beklenmeyen bir hata oluştu' });
    }
};

export const getCompanyInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Firma Bilgileri İstendi ===');
        const { data: companyInfo, error } = await adminSupabase
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
                const { data: updatedData, error: updateError } = await adminSupabase
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