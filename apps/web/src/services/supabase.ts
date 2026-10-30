import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swsgkfhcqeujbkrngzss.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FyHZ4FW8DzeexHRtLaLouw_WuVm_tk1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
