import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

const router = Router();

// Yönetici girişi
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            throw error;
        }

        console.log('User logged in:', data.user?.id);

        // Kullanıcının yönetici olup olmadığını kontrol et
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        console.log('Admin check result:', { adminData, adminError });

        if (adminError) {
            console.error('Admin check error:', adminError);
            res.status(403).json({ error: 'Yönetici kontrolü sırasında hata oluştu' });
            return;
        }

        if (!adminData) {
            console.log('User is not admin:', data.user.id);
            res.status(403).json({ error: 'Yönetici yetkisi gerekli' });
            return;
        }

        console.log('Admin login successful:', adminData);

        res.status(200).json({
            user: data.user,
            session: data.session,
        });
    } catch (error) {
        console.error('Login process error:', error);
        res.status(401).json({ error: 'Giriş başarısız' });
    }
});

// Çıkış yap
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
    } catch (error) {
        res.status(500).json({ error: 'Çıkış yapılırken bir hata oluştu' });
    }
});

export default router; 