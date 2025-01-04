import { Request, Response } from 'express';
import { CompanyInfoModel } from '../models/CompanyInfo';
import { supabase } from '../config/supabaseClient';

const companyInfoModel = new CompanyInfoModel(supabase);

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

        // Güncellenecek veriyi hazırla
        const updateData = {
            company_name: req.body.company_name,
            company_address: req.body.company_address,
            phone_number: req.body.phone_number,
            social_media: req.body.social_media || {},
            logo_url: req.body.logo_url
        };

        console.log('5. Güncellenecek veri:', JSON.stringify(updateData, null, 2));

        const companyInfo = await companyInfoModel.update(id, updateData);

        console.log('6. Güncelleme başarılı:', JSON.stringify(companyInfo, null, 2));
        console.log('=== Update İsteği Tamamlandı ===');

        return res.status(200).json(companyInfo);
    } catch (error: any) {
        console.error('Update Company Info Error:', {
            message: error.message,
            stack: error.stack
        });

        // Hata mesajına göre durum kodu belirleme
        let statusCode = 400;
        if (error.message.includes('bulunamadı')) {
            statusCode = 404;
        } else if (error.message.includes('yetkiniz yok')) {
            statusCode = 403;
        }

        return res.status(statusCode).json({ error: error.message });
    }
};

export const getCompanyInfo = async (_req: Request, res: Response) => {
    try {
        console.log('Firma bilgileri istendi');
        const companyInfo = await companyInfoModel.getCompanyInfo();
        console.log('Firma bilgileri bulundu:', companyInfo);
        res.status(200).json(companyInfo);
    } catch (error: any) {
        console.error('Get Company Info Error:', error);
        const statusCode = error.message.includes('bulunamadı') ? 404 : 400;
        res.status(statusCode).json({ error: error.message });
    }
};