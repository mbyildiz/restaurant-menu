import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase konfigürasyon değişkenleri eksik!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
    }
});

// Supabase auth değişikliklerini dinle
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth durumu değişti:', { event, session });
    if (session) {
        // Auth header'ı güncelle
        supabase.realtime.setAuth(session.access_token);
    }
}); 