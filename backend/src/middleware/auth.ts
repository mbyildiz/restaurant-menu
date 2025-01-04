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
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
            return;
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Geçersiz token' });
            return;
        }

        // Kullanıcının yönetici olup olmadığını kontrol et
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (adminError || !adminData) {
            res.status(403).json({ error: 'Yönetici yetkisi gerekli' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Kimlik doğrulama hatası' });
    }
}; 