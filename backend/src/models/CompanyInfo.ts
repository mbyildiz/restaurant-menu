import { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyInfo {
    id?: string;
    company_name: string;
    company_address: string;
    phone_number: string;
    website?: string;
    qr_code?: string;
    social_media?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    logo_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class CompanyInfoModel {
    private supabase: SupabaseClient;
    private tableName = 'company_info';

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async create(companyInfo: CompanyInfo) {
        console.log('=== Yeni Kayıt Oluşturuluyor ===');
        console.log('1. Gelen veri:', JSON.stringify(companyInfo, null, 2));

        try {
            // Zorunlu alanları kontrol et
            if (!companyInfo.company_name || !companyInfo.company_address || !companyInfo.phone_number) {
                throw new Error('Firma adı, adresi ve telefon numarası zorunludur');
            }

            // Veriyi hazırla
            const newCompanyData = {
                company_name: companyInfo.company_name.trim(),
                company_address: companyInfo.company_address.trim(),
                phone_number: companyInfo.phone_number.trim(),
                social_media: companyInfo.social_media || {},
                logo_url: companyInfo.logo_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('2. Kaydedilecek veri:', JSON.stringify(newCompanyData, null, 2));

            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert(newCompanyData)
                .select('*')
                .single();

            if (error) {
                console.error('3. Kayıt hatası:', error);
                throw error;
            }

            if (!data) {
                throw new Error('Kayıt oluşturuldu ancak veri alınamadı');
            }

            console.log('4. Kayıt başarılı:', JSON.stringify(data, null, 2));
            return data;
        } catch (error: any) {
            console.error('5. Hata:', error);
            throw new Error(error.message || 'Firma kaydı oluşturulurken bir hata oluştu');
        }
    }

    async update(id: string, companyInfo: Partial<CompanyInfo>) {
        console.log('=== Güncelleme İşlemi Başlıyor ===');
        console.log('1. Gelen ID:', id);
        console.log('2. Gelen veri:', {
            ...companyInfo,
            qr_code: companyInfo.qr_code ? 'QR Kod var (base64)' : 'QR Kod yok'
        });

        const cleanId = id.trim();

        // ID kontrolü
        if (!cleanId) {
            throw new Error('Geçerli bir ID bulunamadı');
        }

        try {
            // Güncellenecek veriyi hazırla
            const updateData = {
                company_name: companyInfo.company_name,
                company_address: companyInfo.company_address,
                phone_number: companyInfo.phone_number,
                website: companyInfo.website,
                social_media: companyInfo.social_media,
                logo_url: companyInfo.logo_url,
                qr_code: companyInfo.qr_code,
                updated_at: new Date().toISOString()
            };

            console.log('3. Güncellenecek veri:', {
                ...updateData,
                qr_code: updateData.qr_code ? 'QR Kod var (base64)' : 'QR Kod yok'
            });

            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', cleanId)
                .select('*')
                .single();

            if (error) {
                console.error('4. Güncelleme hatası:', error);
                throw error;
            }

            if (!data) {
                throw new Error('Güncelleme sonrası veri bulunamadı');
            }

            console.log('5. Güncelleme başarılı:', {
                ...data,
                qr_code: data.qr_code ? 'QR Kod var (base64)' : 'QR Kod yok'
            });
            return data;
        } catch (error: any) {
            console.error('6. Hata:', error);
            throw new Error(error.message || 'Güncelleme işlemi başarısız oldu');
        }
    }

    async getCompanyInfo() {
        console.log('=== Firma Bilgileri Getiriliyor ===');

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('1. Hata: Firma bilgileri getirme hatası:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            if (!data || data.length === 0) {
                console.log('2. Firma bilgisi bulunamadı');
                return null;
            }

            console.log('3. Bulunan firma bilgileri:', JSON.stringify(data[0], null, 2));
            console.log('=== Firma Bilgileri Getirildi ===');
            return data[0];
        } catch (error: any) {
            console.error('4. Beklenmeyen hata:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}