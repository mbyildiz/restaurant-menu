import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Grid,
    CircularProgress,
    Alert,
    CardMedia,
    Link,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { supabase } from '../config/supabaseClient';

interface CompanyInfoForm {
    company_name: string;
    company_address: string;
    phone_number: string;
    social_media: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    logo_url?: string;
}

const CompanyInfo = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<CompanyInfoForm>({
        defaultValues: {
            company_name: '',
            company_address: '',
            phone_number: '',
            social_media: {
                facebook: '',
                instagram: '',
                twitter: ''
            },
            logo_url: ''
        }
    });

    const currentLogo = watch('logo_url');

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('company_info')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Veri çekme hatası:', error);
                setError('Firma bilgileri yüklenirken hata oluştu');
                return;
            }

            if (data) {
                setCompanyId(data.id);
                reset({
                    company_name: data.company_name || '',
                    company_address: data.company_address || '',
                    phone_number: data.phone_number || '',
                    social_media: data.social_media || {
                        facebook: '',
                        instagram: '',
                        twitter: ''
                    },
                    logo_url: data.logo_url || ''
                });
                setLogoPreview(data.logo_url || '');
            } else {
                // İlk kayıt oluştur
                const { data: newCompany, error: createError } = await supabase
                    .from('company_info')
                    .insert([{
                        company_name: '',
                        company_address: '',
                        phone_number: '',
                        social_media: {
                            facebook: '',
                            instagram: '',
                            twitter: ''
                        }
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Kayıt oluşturma hatası:', createError);
                    setError('Firma kaydı oluşturulurken hata oluştu');
                    return;
                }

                if (newCompany) {
                    setCompanyId(newCompany.id);
                }
            }
        } catch (error: any) {
            console.error('Beklenmeyen hata:', error);
            setError('Firma bilgileri yüklenirken beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            // Dosya boyutu kontrolü (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Logo dosyası 5MB\'dan küçük olmalıdır');
                return;
            }

            setLogoFile(file);
            setError(null);

            // Resim önizleme
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoDelete = async () => {
        if (!currentLogo || !window.confirm('Logo resmini silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Eski logoyu storage'dan sil
            const fileName = currentLogo.split('/').pop();
            if (fileName) {
                const { error: storageError } = await supabase.storage
                    .from('company-logos')
                    .remove([fileName]);

                if (storageError) {
                    console.error('Logo silme hatası:', storageError);
                    throw new Error('Logo silinirken hata oluştu');
                }
            }

            // Veritabanından logo_url'i temizle
            const { error: updateError } = await supabase
                .from('company_info')
                .update({ logo_url: null })
                .eq('id', companyId);

            if (updateError) {
                console.error('Logo URL güncelleme hatası:', updateError);
                throw new Error('Logo bilgisi güncellenirken hata oluştu');
            }

            setValue('logo_url', '');
            setLogoPreview('');
            setLogoFile(null);
            setSuccess('Logo başarıyla silindi');
        } catch (error: any) {
            console.error('Logo silme işlemi hatası:', error);
            setError(error.message || 'Logo silinirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: CompanyInfoForm) => {
        if (!companyId) {
            setError('Firma ID bulunamadı');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            let logoUrl = currentLogo;

            // Yeni logo yüklendiyse
            if (logoFile) {
                try {
                    // Eski logoyu sil
                    if (currentLogo) {
                        const oldFileName = currentLogo.split('/').pop();
                        if (oldFileName) {
                            await supabase.storage
                                .from('company-logos')
                                .remove([oldFileName]);
                        }
                    }

                    // Dosya adını güvenli hale getir
                    const fileExt = logoFile.name.split('.').pop();
                    const safeFileName = `logo-${Date.now()}.${fileExt}`;

                    // Yeni logoyu yükle
                    const { error: uploadError } = await supabase.storage
                        .from('company-logos')
                        .upload(safeFileName, logoFile, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error('Logo yükleme hatası:', uploadError);
                        throw new Error('Logo yüklenirken hata oluştu');
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(safeFileName);

                    logoUrl = publicUrl;
                } catch (uploadError: any) {
                    console.error('Logo yükleme işlemi hatası:', uploadError);
                    throw new Error('Logo yüklenirken hata oluştu: ' + uploadError.message);
                }
            }

            // Firma bilgilerini güncelle
            const { error: updateError } = await supabase
                .from('company_info')
                .update({
                    company_name: data.company_name.trim(),
                    company_address: data.company_address.trim(),
                    phone_number: data.phone_number.trim(),
                    social_media: {
                        facebook: data.social_media?.facebook?.trim() || '',
                        instagram: data.social_media?.instagram?.trim() || '',
                        twitter: data.social_media?.twitter?.trim() || ''
                    },
                    logo_url: logoUrl
                })
                .eq('id', companyId);

            if (updateError) {
                console.error('Güncelleme hatası:', updateError);
                throw new Error('Firma bilgileri güncellenirken hata oluştu');
            }

            setSuccess('Firma bilgileri başarıyla güncellendi');
            await fetchCompanyInfo();
        } catch (error: any) {
            console.error('İşlem hatası:', error);
            setError(error.message || 'Firma bilgileri kaydedilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Firma Bilgileri
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Firma Adı"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('company_name', { required: 'Firma adı gereklidir' })}
                                error={!!errors.company_name}
                                helperText={errors.company_name?.message}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Firma Adresi"
                                multiline
                                rows={3}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('company_address', { required: 'Firma adresi gereklidir' })}
                                error={!!errors.company_address}
                                helperText={errors.company_address?.message}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Telefon Numarası"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('phone_number', { required: 'Telefon numarası gereklidir' })}
                                error={!!errors.phone_number}
                                helperText={errors.phone_number?.message}
                            />
                        </Grid>

                        {(['facebook', 'instagram', 'twitter'] as const).map((platform) => {
                            const socialMedia = watch('social_media');
                            const url = socialMedia?.[platform];
                            const labels = {
                                facebook: { label: 'Facebook', icon: '🌐' },
                                instagram: { label: 'Instagram', icon: '📸' },
                                twitter: { label: 'Twitter', icon: '🐦' }
                            };

                            return (
                                <Grid item xs={12} key={platform}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={labels[platform].label}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        sx={{
                                            '& .MuiInputLabel-root': {
                                                background: '#fff',
                                                padding: '0 8px',
                                            }
                                        }}
                                        {...register(`social_media.${platform}` as const)}
                                    />
                                    {url && typeof url === 'string' && url.trim().length > 0 && (
                                        <Link
                                            href={url.startsWith('http') ? url : `https://${url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                                        >
                                            {labels[platform].icon} {labels[platform].label} Sayfasını Ziyaret Et
                                        </Link>
                                    )}
                                </Grid>
                            );
                        })}

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Firma Logosu
                            </Typography>
                            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {logoPreview && (
                                    <Box sx={{ mb: 2, width: '100%', maxWidth: 300 }}>
                                        <CardMedia
                                            component="img"
                                            image={logoPreview}
                                            alt="Firma Logosu"
                                            sx={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: 200,
                                                objectFit: 'contain',
                                                borderRadius: 1
                                            }}
                                        />
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        disabled={loading}
                                    >
                                        Logo Seç
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                        />
                                    </Button>
                                    {logoPreview && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={handleLogoDelete}
                                            disabled={loading}
                                        >
                                            Logo Sil
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                fullWidth
                            >
                                {loading ? <CircularProgress size={24} /> : 'Kaydet'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default CompanyInfo; 