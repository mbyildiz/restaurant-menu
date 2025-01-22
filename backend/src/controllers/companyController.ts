import { Request, Response } from 'express';
import { CompanyInfoModel } from '../models/CompanyInfo';
import { adminSupabase, supabase } from '../config/supabaseClient';
import QRCode from 'qrcode';

const companyInfoModel = new CompanyInfoModel(adminSupabase);

// QR kod oluşturma fonksiyonu
async function generateQRCode(url: string): Promise<string> {
    try {

        // URL'i düzelt
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

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

        return res.status(200).json(updatedCompany);
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        return res.status(500).json({ error: 'Firma bilgileri güncellenirken beklenmeyen bir hata oluştu' });
    }
};

export const getCompanyInfo = async (_req: Request, res: Response): Promise<void> => {
    try {

        // Supabase client'ı doğrudan kullan
        const { data: companyInfo, error } = await supabase
            .from('company_info')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Veri çekme hatası:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            if (error.code === 'PGRST301') {
                res.status(404).json({ error: 'Firma bilgisi bulunamadı' });
                return;
            }

            res.status(500).json({ error: error.message });
            return;
        }

        if (!companyInfo) {
            res.status(404).json({ error: 'Firma bilgisi bulunamadı' });
            return;
        }

        res.status(200).json(companyInfo);
    } catch (error: any) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({ error: error.message });
    }
};