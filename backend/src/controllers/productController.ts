import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { Product } from '../models/Product';

// Tüm ürünleri getir
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Ürünler getirilirken bir hata oluştu' });
    }
};

// Kategori bazlı ürünleri getir
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category } = req.params;
        const { data, error } = await supabase
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

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Ürünler getirilirken bir hata oluştu' });
    }
};

// Yeni ürün ekle
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const product: Product = req.body;
        const imageBase64Array = req.body.imageBase64Array || [];
        const imageUrls: string[] = [];

        // Resimleri yükle
        for (const imageBase64 of imageBase64Array) {
            const base64Data = imageBase64.split(',')[1];
            const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase
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

        const productData = {
            ...product,
            images: imageUrls
        };

        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `);

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ürün eklenirken bir hata oluştu' });
    }
};

// Ürün güncelle
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const imageBase64Array = req.body.imageBase64Array || [];

        // Eğer yeni resimler yükleniyorsa
        if (imageBase64Array.length > 0) {
            // Önce eski resimleri sil
            const { data: oldProduct } = await supabase
                .from('products')
                .select('images')
                .eq('id', id)
                .single();

            if (oldProduct?.images) {
                for (const imageUrl of oldProduct.images) {
                    const fileName = imageUrl.split('/').pop();
                    await supabase
                        .storage
                        .from('product-images')
                        .remove([fileName]);
                }
            }

            // Yeni resimleri yükle
            const imageUrls: string[] = [];
            for (const imageBase64 of imageBase64Array) {
                const base64Data = imageBase64.split(',')[1];
                const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                const { data: uploadData, error: uploadError } = await supabase
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

            updates.images = imageUrls;
        }

        delete updates.imageBase64Array;

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                categories:category_id (
                    id,
                    name
                )
            `);

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ürün güncellenirken bir hata oluştu' });
    }
};

// Ürün sil
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Önce ürünü al
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('images')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Eğer resimler varsa, önce resimleri sil
        if (product?.images) {
            for (const imageUrl of product.images) {
                const fileName = imageUrl.split('/').pop();
                const { error: deleteImageError } = await supabase
                    .storage
                    .from('product-images')
                    .remove([fileName]);

                if (deleteImageError) throw deleteImageError;
            }
        }

        // Ürünü sil
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Ürün silinirken bir hata oluştu' });
    }
};

// Ürün resimlerini yükle
export const uploadProductImages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, images } = req.body;

        const imageUrls: string[] = [];

        // Resimleri yükle
        for (const imageBase64 of images) {
            const base64Data = imageBase64.split(',')[1];
            const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase
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
        const { error: updateError } = await supabase
            .from('products')
            .update({ images: imageUrls })
            .eq('id', productId);

        if (updateError) throw updateError;

        res.status(200).json({ imageUrls });
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        res.status(500).json({ error: 'Resimler yüklenirken bir hata oluştu' });
    }
}; 