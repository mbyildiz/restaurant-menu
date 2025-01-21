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
import QRCode from 'qrcode';
import { company, upload } from '../services/api';
import axios from 'axios';

interface CompanyInfoForm {
    company_name: string;
    company_address: string;
    phone_number: string;
    whatsapp?: string;
    website?: string;
    social_media: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    logo_url?: string;
    qr_code?: string;
    maps?: string;
}

const CompanyInfo = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [companyInfo, setCompanyInfo] = useState<CompanyInfoForm | null>(null);
    const [storedLogo, setStoredLogo] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<CompanyInfoForm>({
        defaultValues: {
            company_name: '',
            company_address: '',
            phone_number: '',
            whatsapp: '',
            website: '',
            social_media: {
                facebook: '',
                instagram: '',
                twitter: ''
            },
            logo_url: '',
            maps: ''
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

            const data = await company.getInfo();

            if (data) {
                setCompanyId(data.id);
                setCompanyInfo(data);
                reset({
                    company_name: data.company_name || '',
                    company_address: data.company_address || '',
                    phone_number: data.phone_number || '',
                    whatsapp: data.whatsapp || '',
                    website: data.website || '',
                    social_media: data.social_media || {
                        facebook: '',
                        instagram: '',
                        twitter: ''
                    },
                    logo_url: data.logo_url || '',
                    maps: data.maps || ''
                });
                setLogoPreview(data.logo_url || '');
                setStoredLogo(data.logo_url || null);
            }
        } catch (error: any) {
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

            // Firma bilgilerini güncelle
            await company.update({ logo_url: null });

            setValue('logo_url', '');
            setLogoPreview('');
            setLogoFile(null);
            setStoredLogo(null);
            setSuccess('Logo başarıyla silindi');
        } catch (error: any) {
            console.error('Logo silme işlemi hatası:', error);
            setError(error.message || 'Logo silinirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async (websiteUrl: string): Promise<string> => {
        try {
            const qrDataUrl = await QRCode.toDataURL(websiteUrl);
            return qrDataUrl;
        } catch (error) {
            throw new Error('QR kod oluşturulurken hata oluştu');
        }
    };

    const onSubmit = async (data: CompanyInfoForm) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Token kontrolü
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
                window.location.href = '/login';
                return;
            }

            let logoUrl = null;
            let qrCodeUrl = null;

            if (data.website) {
                try {
                    qrCodeUrl = await generateQRCode(data.website);
                } catch (error: any) {
                    setError('QR kod oluşturulurken bir hata oluştu');
                    return;
                }
            }

            if (logoFile) {
                try {
                    const uploadResponse = await company.uploadLogo(logoFile);
                    logoUrl = uploadResponse.url;
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
                        window.location.href = '/login';
                        return;
                    }
                    setError('Logo yüklenirken bir hata oluştu');
                    return;
                }
            }

            // Firma bilgilerini güncelle
            const updateData = {
                company_name: data.company_name,
                company_address: data.company_address,
                phone_number: data.phone_number,
                whatsapp: data.whatsapp,
                website: data.website,
                social_media: data.social_media,
                logo_url: logoUrl || storedLogo,
                qr_code: qrCodeUrl,
                maps: data.maps,
                updated_at: new Date().toISOString()
            };

            try {
                const response = await company.update(updateData);
                if (response.success) {
                    setSuccess('Firma bilgileri başarıyla güncellendi');
                    // Yeni bilgileri yükle
                    fetchCompanyInfo();
                }
            } catch (error: any) {
                if (error.response?.status === 401) {
                    setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
                    window.location.href = '/login';
                    return;
                }
                setError(error.response?.data?.error || 'Firma bilgileri güncellenirken bir hata oluştu');
            }
        } catch (error: any) {
            setError('Beklenmeyen bir hata oluştu');
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

                        <Grid item xs={12} sm={6}>
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

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="WhatsApp Numarası"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('whatsapp')}
                                helperText="Örnek: 905321234567 (Başında 90 olmalı)"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Website Adresi"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('website')}
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

                        {watch('website') && (
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Website QR Kodu
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Box sx={{
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        backgroundColor: '#fff'
                                    }}>
                                        {companyInfo?.qr_code ? (
                                            <img
                                                src={companyInfo.qr_code}
                                                alt="Website QR Code"
                                                style={{
                                                    width: '250px',
                                                    height: '250px',
                                                    display: 'block'
                                                }}
                                            />
                                        ) : (
                                            <Typography color="textSecondary">
                                                QR kod yükleniyor...
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Google Maps Embed URL"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#fff',
                                        padding: '0 8px',
                                    }
                                }}
                                {...register('maps')}
                                helperText="Google Maps Embed URL'ini buraya yapıştırın (iframe src değeri)"
                            />
                        </Grid>

                        {/* Maps Önizleme */}
                        {(() => {
                            const mapsUrl = watch('maps');
                            if (!mapsUrl) return null;

                            // URL'nin geçerli olup olmadığını kontrol et
                            const isValidUrl = mapsUrl.startsWith('https://www.google.com/maps/embed');

                            return (
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Konum Haritası
                                    </Typography>
                                    {isValidUrl ? (
                                        <Box sx={{ width: '100%', height: '400px', mt: 2 }}>
                                            <iframe
                                                src={mapsUrl}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                title="Google Maps"
                                            />
                                        </Box>
                                    ) : (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            Lütfen geçerli bir Google Maps Embed URL'si girin. URL "https://www.google.com/maps/embed" ile başlamalıdır.
                                        </Alert>
                                    )}
                                </Grid>
                            );
                        })()}

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