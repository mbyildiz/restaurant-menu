import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { supabase, adminSupabase } from '../config/supabaseClient';
import { Category } from '../models/Category';
import * as fs from 'fs/promises';
import * as path from 'path';

// Tüm kategorileri getir
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data: categories, error, status } = await adminSupabase
            .from('categories')
            .select('*')
            .order('order_number', { ascending: true });

        if (error) {
            console.error('Kategoriler getirilirken hata:', error);
            res.status(status || 500).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: categories,
            count: categories?.length || 0
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Kategori detayını getir
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: category, error, status } = await adminSupabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            res.status(status || 404).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Kategori bulunamadı'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Dosya adını güvenli hale getiren yardımcı fonksiyon
const sanitizeFileName = (fileName: string): string => {
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

// Yeni kategori ekle
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Gelen form verileri:', req.body);
        console.log('Gelen dosyalar:', req.files);

        const { name, description, order_number } = req.body;

        if (!name) {
            console.log('Kategori adı eksik');
            res.status(400).json({
                success: false,
                error: 'Kategori adı zorunludur'
            });
            return;
        }

        let imageUrl: string | null = null;

        if (req.files && typeof req.files === 'object' && 'image' in req.files) {
            const image = req.files.image as UploadedFile;
            console.log('Yüklenen resim:', image.name, image.mimetype);

            // Dosya tipi kontrolü
            if (!image.mimetype.startsWith('image/')) {
                console.log('Geçersiz dosya tipi:', image.mimetype);
                res.status(400).json({
                    success: false,
                    error: 'Geçersiz dosya tipi. Sadece resim dosyaları yüklenebilir.'
                });
                return;
            }

            const safeFileName = sanitizeFileName(image.name);
            const fileName = `category-${Date.now()}-${safeFileName}`;
            console.log('Oluşturulan dosya adı:', fileName);

            try {
                // Windows'ta dosya yolunu düzelt
                const normalizedPath = path.normalize(image.tempFilePath);
                console.log('Dosya yolu:', normalizedPath);

                // Dosya boyutunu kontrol et
                const stats = await fs.stat(normalizedPath);
                console.log('Dosya boyutu:', stats.size);

                // Dosyayı oku
                const fileContent = await fs.readFile(normalizedPath);
                console.log('Okunan dosya boyutu:', fileContent.length);

                // Resmi yükle
                const { data: uploadData, error: uploadError } = await adminSupabase
                    .storage
                    .from('category-images')
                    .upload(fileName, fileContent, {
                        contentType: image.mimetype,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Resim yükleme hatası:', uploadError);
                    throw uploadError;
                }

                console.log('Resim yükleme başarılı:', uploadData);

                // Public URL'yi al
                const { data: { publicUrl } } = adminSupabase
                    .storage
                    .from('category-images')
                    .getPublicUrl(fileName);

                console.log('Oluşturulan public URL:', publicUrl);
                imageUrl = publicUrl;
            } catch (error) {
                console.error('Resim yükleme işlemi hatası:', error);
                throw error;
            }
        }

        const categoryData = {
            name,
            description: description || null,
            image: imageUrl,
            order_number: parseInt(order_number) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Kaydedilecek kategori verileri:', categoryData);

        const { data, error, status } = await adminSupabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();

        if (error) {
            console.error('Kategori kaydetme hatası:', error);
            res.status(status || 400).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        console.log('Kategori başarıyla kaydedildi:', data);
        res.status(201).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu',
            details: error
        });
    }
};

// Kategori güncelle
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Güncelleme için gelen veriler:', {
            params: req.params,
            body: req.body,
            files: req.files
        });

        const { id } = req.params;
        const { name, description, order_number } = req.body;

        // Mevcut kategoriyi kontrol et
        const { data: existingCategory, error: fetchError } = await adminSupabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingCategory) {
            console.error('Kategori bulunamadı:', { id, error: fetchError });
            res.status(404).json({
                success: false,
                error: 'Kategori bulunamadı'
            });
            return;
        }

        console.log('Mevcut kategori:', existingCategory);

        const updateData: any = {
            name: name || existingCategory.name,
            description: description !== undefined ? description : existingCategory.description,
            order_number: order_number ? parseInt(order_number) : existingCategory.order_number,
            updated_at: new Date().toISOString()
        };

        if (req.files && typeof req.files === 'object' && 'image' in req.files) {
            const image = req.files.image as UploadedFile;
            console.log('Yeni yüklenen resim:', image.name, image.mimetype);

            // Dosya tipi kontrolü
            if (!image.mimetype.startsWith('image/')) {
                console.log('Geçersiz dosya tipi:', image.mimetype);
                res.status(400).json({
                    success: false,
                    error: 'Geçersiz dosya tipi. Sadece resim dosyaları yüklenebilir.'
                });
                return;
            }

            // Eski resmi sil
            if (existingCategory.image) {
                try {
                    const oldFileName = existingCategory.image.split('/category-images/').pop();
                    if (oldFileName) {
                        console.log('Silinecek eski resim:', oldFileName);
                        const { error: deleteError } = await adminSupabase.storage
                            .from('category-images')
                            .remove([oldFileName]);

                        if (deleteError) {
                            console.error('Eski resim silinirken hata:', deleteError);
                            throw deleteError;
                        }
                        console.log('Eski resim başarıyla silindi');
                    }
                } catch (error) {
                    console.error('Eski resim silme hatası:', error);
                }
            }

            // Yeni resmi yükle
            const safeFileName = sanitizeFileName(image.name);
            const fileName = `category-${Date.now()}-${safeFileName}`;
            console.log('Yeni resim için oluşturulan dosya adı:', fileName);

            try {
                // Windows'ta dosya yolunu düzelt
                const normalizedPath = path.normalize(image.tempFilePath);
                console.log('Dosya yolu:', normalizedPath);

                // Dosya boyutunu kontrol et
                const stats = await fs.stat(normalizedPath);
                console.log('Dosya boyutu:', stats.size);

                // Dosyayı oku
                const fileContent = await fs.readFile(normalizedPath);
                console.log('Okunan dosya boyutu:', fileContent.length);

                // Resmi yükle
                const { data: uploadData, error: uploadError } = await adminSupabase
                    .storage
                    .from('category-images')
                    .upload(fileName, fileContent, {
                        contentType: image.mimetype,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Resim yükleme hatası:', uploadError);
                    throw uploadError;
                }

                console.log('Resim yükleme başarılı:', uploadData);

                // Public URL'yi al
                const { data: { publicUrl } } = adminSupabase
                    .storage
                    .from('category-images')
                    .getPublicUrl(fileName);

                console.log('Oluşturulan public URL:', publicUrl);
                updateData.image = publicUrl;
            } catch (error) {
                console.error('Resim yükleme işlemi hatası:', error);
                throw error;
            }
        }

        console.log('Güncellenecek veriler:', updateData);

        const { data, error: updateError, status } = await adminSupabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Kategori güncellenirken hata:', updateError);
            res.status(status || 400).json({
                success: false,
                error: updateError.message,
                details: updateError.details
            });
            return;
        }

        console.log('Kategori başarıyla güncellendi:', data);
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu',
            details: error
        });
    }
};

// Kategori sil
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Kategoriyi kontrol et
        const { data: category, error: fetchError } = await adminSupabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !category) {
            res.status(404).json({
                success: false,
                error: 'Kategori bulunamadı'
            });
            return;
        }

        // Resmi sil
        if (category.image) {
            try {
                const fileName = category.image.split('/category-images/').pop();
                if (fileName) {
                    console.log('Silinecek resim:', fileName);
                    const { error: deleteError } = await adminSupabase.storage
                        .from('category-images')
                        .remove([fileName]);

                    if (deleteError) {
                        console.error('Resim silinirken hata:', deleteError);
                        throw deleteError;
                    }
                    console.log('Resim başarıyla silindi');
                }
            } catch (error) {
                console.error('Resim silme hatası:', error);
            }
        }

        // Kategoriyi sil
        const { error: deleteError, status } = await adminSupabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (deleteError) {
            res.status(status || 400).json({
                success: false,
                error: deleteError.message,
                details: deleteError.details
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Kategori başarıyla silindi'
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Kategori sıralama güncelle
export const updateCategoryOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { categories } = req.body;

        if (!Array.isArray(categories)) {
            res.status(400).json({
                success: false,
                error: 'Geçersiz veri formatı'
            });
            return;
        }

        // Gelen verilerin doğruluğunu kontrol et
        for (const cat of categories) {
            if (!cat.id || typeof cat.order_number !== 'number') {
                res.status(400).json({
                    success: false,
                    error: 'Geçersiz kategori verisi',
                    details: 'Her kategori için id ve order_number gereklidir'
                });
                return;
            }
        }

        const updates = categories.map(async (cat) => {
            const { error } = await adminSupabase
                .from('categories')
                .update({ order_number: cat.order_number })
                .eq('id', cat.id);

            if (error) {
                throw {
                    message: 'Kategori güncellenirken hata oluştu',
                    details: error
                };
            }
        });

        await Promise.all(updates);

        res.status(200).json({
            success: true,
            message: 'Kategori sıralaması güncellendi'
        });
    } catch (error: any) {
        console.error('Kategori sıralama hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Sunucu hatası oluştu',
            details: error.details || undefined
        });
    }
}; 