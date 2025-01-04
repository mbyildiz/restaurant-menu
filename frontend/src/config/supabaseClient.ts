import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Supabase auth değişikliklerini dinle
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        // Auth header'ı güncelle
        supabase.realtime.setAuth(session.access_token);
    }
}); 