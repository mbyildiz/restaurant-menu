import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Kullanıcının admin olup olmadığını kontrol et
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        if (adminError || !adminData) {
            throw new Error('Yönetici yetkisi gerekli');
        }

        res.status(200).json({
            session: data.session,
            user: data.user
        });
    } catch (error: any) {
        res.status(401).json({
            error: error.message || 'Giriş başarısız'
        });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.status(200).json({ message: 'Çıkış başarılı' });
    } catch (error: any) {
        res.status(500).json({
            error: error.message || 'Çıkış yapılırken hata oluştu'
        });
    }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('Token bulunamadı');
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new Error('Geçersiz oturum');
        }

        // Admin kontrolü
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (adminError || !adminData) {
            throw new Error('Yönetici yetkisi gerekli');
        }

        res.status(200).json({
            user,
            token
        });
    } catch (error: any) {
        res.status(401).json({
            error: error.message || 'Oturum bilgisi alınamadı'
        });
    }
}; 