import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient';
import { User } from '@supabase/supabase-js';

declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Token kontrolü
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Authorization header bulunamadı' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Token formatı geçersiz' });
            return;
        }

        // Token ile kullanıcı bilgilerini al
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError) {
            console.error('Supabase user error:', userError);
            res.status(401).json({ error: 'Token doğrulanamadı', details: userError.message });
            return;
        }

        if (!user) {
            res.status(401).json({ error: 'Kullanıcı bulunamadı' });
            return;
        }

        // Admin kontrolü
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (adminError) {
            console.error('Admin check error:', adminError);
            res.status(401).json({ error: 'Admin kontrolü yapılamadı', details: adminError.message });
            return;
        }

        if (!adminData) {
            res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekli' });
            return;
        }

        // Kullanıcı bilgilerini request'e ekle
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Kimlik doğrulama sırasında bir hata oluştu' });
    }
}; 