import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getVisitorCount = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('count')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Ziyaretçi sayısı alınamadı:', error);
            return res.status(500).json({ error: 'Ziyaretçi sayısı alınamadı' });
        }

        return res.json({ count: data?.count || 0 });
    } catch (error) {
        console.error('Ziyaretçi sayısı alınamadı:', error);
        return res.status(500).json({ error: 'Ziyaretçi sayısı alınamadı' });
    }
};

export const incrementVisitorCount = async (req: Request, res: Response) => {
    try {
        // Mevcut sayıyı al ve güncelle
        const { data: currentData, error: fetchError } = await supabase
            .from('visitors')
            .select('count')
            .eq('id', 1)
            .single();

        if (fetchError) {
            console.error('Ziyaretçi sayısı alınamadı:', fetchError);
            return res.status(500).json({ error: 'Ziyaretçi sayısı alınamadı' });
        }

        const currentCount = currentData?.count || 0;
        const newCount = currentCount + 1;

        const { error: updateError } = await supabase
            .from('visitors')
            .update({ count: newCount })
            .eq('id', 1);

        if (updateError) {
            console.error('Ziyaretçi sayısı güncellenemedi:', updateError);
            return res.status(500).json({ error: 'Ziyaretçi sayısı güncellenemedi' });
        }

        return res.json({ success: true, count: newCount });
    } catch (error) {
        console.error('Ziyaretçi sayısı güncellenirken hata:', error);
        return res.status(500).json({ error: 'Ziyaretçi sayısı güncellenirken hata oluştu' });
    }
}; 