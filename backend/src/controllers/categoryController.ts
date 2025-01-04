import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { Category } from '../models/Category';

// Tüm kategorileri getir
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Kategoriler getirilirken bir hata oluştu' });
    }
};

// Yeni kategori ekle
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const category: Category = req.body;

        // Resim yükleme işlemi
        let imageUrl = '';
        if (req.body.imageBase64) {
            const base64Data = req.body.imageBase64.split(',')[1];
            const fileName = `category-${Date.now()}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('category-images')
                .upload(fileName, Buffer.from(base64Data, 'base64'), {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('category-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        const categoryData = {
            ...category,
            image: imageUrl || null
        };

        const { data, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Kategori eklenirken bir hata oluştu' });
    }
};

// Kategori güncelle
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Eğer yeni bir resim yükleniyorsa
        if (req.body.imageBase64) {
            const base64Data = req.body.imageBase64.split(',')[1];
            const fileName = `category-${Date.now()}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('category-images')
                .upload(fileName, Buffer.from(base64Data, 'base64'), {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('category-images')
                .getPublicUrl(fileName);

            updates.image = publicUrl;
        }

        delete updates.imageBase64;

        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Kategori güncellenirken bir hata oluştu' });
    }
};

// Kategori sil
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Önce kategoriyi al
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('image')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Eğer resim varsa, önce resmi sil
        if (category?.image) {
            const fileName = category.image.split('/').pop();
            const { error: deleteImageError } = await supabase
                .storage
                .from('category-images')
                .remove([fileName]);

            if (deleteImageError) throw deleteImageError;
        }

        // Kategoriyi sil
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Kategori silinirken bir hata oluştu' });
    }
}; 