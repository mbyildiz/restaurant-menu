import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL ve SUPABASE_KEY environment variable\'ları tanımlanmamış!');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 