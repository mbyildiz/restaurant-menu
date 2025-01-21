import { Request, Response } from 'express';
import { adminSupabase as supabase } from '../config/supabaseClient';
import { Product } from '../models/Product';
import path from 'path';
import fs from 'fs/promises';
import { UploadedFile } from 'express-fileupload';

// Dosya adını temizleme fonksiyonu
const sanitizeFileName = (fileName: string): string => {
    // Türkçe karakterleri değiştir
    const turkishChars: { [key: string]: string } = {
        'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ç': 'c', 'Ç': 'C'
    };

    let cleanName = fileName;

    // Türkçe karakterleri değiştir
    Object.entries(turkishChars).forEach(([turkishChar, latinChar]) => {
        cleanName = cleanName.replace(new RegExp(turkishChar, 'g'), latinChar);
    });

    // Sadece alfanumerik karakterler, tire ve alt çizgi kalacak şekilde temizle
    cleanName = cleanName.replace(/[^a-zA-Z0-9-_\.]/g, '-');

    // Birden fazla tireyi tek tireye indir
    cleanName = cleanName.replace(/-+/g, '-');

    // Baştaki ve sondaki tireleri kaldır
    cleanName = cleanName.replace(/^-+|-+$/g, '');

    return cleanName.toLowerCase();
};

// Tüm ürünleri getir
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data: products, error, status } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(status || 500).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: products,
            count: products?.length || 0
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Kategori bazlı ürünleri getir
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category } = req.params;

        if (!category) {
            res.status(400).json({
                success: false,
                error: 'Kategori ID zorunludur'
            });
            return;
        }

        const { data: products, error, status } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
            .eq('category_id', category)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(status || 500).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: products,
            count: products?.length || 0
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Ürün detayını getir
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Ürün ID zorunludur'
            });
            return;
        }

        const { data: product, error, status } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
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

        if (!product) {
            res.status(404).json({
                success: false,
                error: 'Ürün bulunamadı'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Yeni ürün ekle
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Gelen form verileri:', req.body);
        console.log('Gelen dosyalar:', req.files);

        const { name, description, price, category_id } = req.body;

        // Zorunlu alan kontrolleri
        if (!name || !price || !category_id) {
            res.status(400).json({
                success: false,
                error: 'Ürün adı, fiyat ve kategori zorunludur'
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
            const fileName = `product-${Date.now()}-${safeFileName}`;
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
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
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
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                console.log('Oluşturulan public URL:', publicUrl);
                imageUrl = publicUrl;
            } catch (error) {
                console.error('Resim yükleme işlemi hatası:', error);
                throw error;
            }
        }

        const productData = {
            name,
            price: parseFloat(price),
            description: description || null,
            category_id,
            images: imageUrl ? [imageUrl] : [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Kaydedilecek ürün verileri:', productData);

        const { data, error, status } = await supabase
            .from('products')
            .insert([productData])
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
            .single();

        if (error) {
            console.error('Ürün kaydetme hatası:', error);
            res.status(status || 400).json({
                success: false,
                error: error.message,
                details: error.details
            });
            return;
        }

        console.log('Ürün başarıyla kaydedildi:', data);
        res.status(201).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Ürün güncelle
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Güncelleme için gelen veriler:', {
            params: req.params,
            body: req.body,
            files: req.files
        });

        const { id } = req.params;
        const { name, description, price, category_id, images } = req.body;
        let existingImages: string[] = [];

        console.log('1. Gelen ham images verisi:', images);
        console.log('2. images verisi türü:', typeof images);

        try {
            existingImages = Array.isArray(images) ? images : JSON.parse(images || '[]');
            console.log('3. Parse edilen mevcut resimler:', existingImages);
            console.log('4. existingImages türü:', typeof existingImages);
            console.log('5. existingImages bir array mi?', Array.isArray(existingImages));
        } catch (error) {
            console.error('Mevcut resimler parse edilirken hata:', error);
        }

        // Ürünü kontrol et
        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingProduct) {
            console.error('Ürün bulunamadı:', { id, error: fetchError });
            res.status(404).json({
                success: false,
                error: 'Ürün bulunamadı'
            });
            return;
        }

        console.log('6. Mevcut ürün:', existingProduct);
        console.log('7. Mevcut ürünün resimleri:', existingProduct.images);

        const updateData: any = {
            name: name || existingProduct.name,
            price: price ? parseFloat(price) : existingProduct.price,
            description: description !== undefined ? description : existingProduct.description,
            category_id: category_id || existingProduct.category_id,
            images: existingImages,
            updated_at: new Date().toISOString()
        };

        console.log('8. Güncellenecek veriler:', updateData);
        console.log('9. Güncellenecek resimler:', updateData.images);

        // SQL sorgusunu logla
        const updateQuery = supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
            .single();

        const { data, error: updateError, status } = await updateQuery;

        if (updateError) {
            console.error('11. Ürün güncellenirken hata:', updateError);
            res.status(status || 400).json({
                success: false,
                error: updateError.message,
                details: updateError.details
            });
            return;
        }

        console.log('12. Güncelleme sonrası dönen veri:', data);
        console.log('13. Güncelleme sonrası resimler:', data.images);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Ürün sil
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Ürünü kontrol et
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !product) {
            res.status(404).json({
                success: false,
                error: 'Ürün bulunamadı'
            });
            return;
        }

        // Resimleri sil
        if (product.images) {
            for (const imageUrl of product.images) {
                const fileName = imageUrl.split('/').pop();
                if (fileName) {
                    await supabase.storage
                        .from('product-images')
                        .remove([fileName]);
                }
            }
        }

        // Ürünü sil
        const { error: deleteError, status } = await supabase
            .from('products')
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
            message: 'Ürün başarıyla silindi'
        });
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Ürün resimlerini yükle
export const uploadProductImages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, images } = req.body;

        if (!productId || !Array.isArray(images)) {
            res.status(400).json({
                success: false,
                error: 'Ürün ID ve resimler zorunludur'
            });
            return;
        }

        // Ürünü kontrol et
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            res.status(404).json({
                success: false,
                error: 'Ürün bulunamadı'
            });
            return;
        }

        const imageUrls: string[] = [];

        try {
            // Resimleri yükle
            for (const imageBase64 of images) {
                const base64Data = imageBase64.split(',')[1];
                if (!base64Data) {
                    throw new Error('Geçersiz resim formatı');
                }

                const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                const { error: uploadError } = await supabase
                    .storage
                    .from('product-images')
                    .upload(fileName, Buffer.from(base64Data, 'base64'), {
                        contentType: 'image/jpeg'
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase
                    .storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                imageUrls.push(publicUrl);
            }

            // Ürünü güncelle
            const { error: updateError, status } = await supabase
                .from('products')
                .update({
                    images: imageUrls,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (updateError) {
                throw updateError;
            }

            res.status(200).json({
                success: true,
                data: {
                    images: imageUrls
                }
            });
        } catch (error) {
            // Hata durumunda yüklenen resimleri temizle
            for (const imageUrl of imageUrls) {
                const fileName = imageUrl.split('/').pop();
                if (fileName) {
                    await supabase.storage
                        .from('product-images')
                        .remove([fileName]);
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Beklenmeyen hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
};

// Ürün sıralamasını güncelle
export const updateProductOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            res.status(400).json({
                success: false,
                error: 'Geçersiz veri formatı'
            });
            return;
        }

        // Her bir ürün için sıralama numarasını güncelle
        for (const product of products) {
            const { error } = await supabase
                .from('products')
                .update({ order_number: product.order_number })
                .eq('id', product.id);

            if (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
                return;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Ürün sıralaması güncellendi'
        });
    } catch (error) {
        console.error('Sıralama güncellenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası oluştu'
        });
    }
}; 