import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('paste_your')) {
    throw new Error('Supabase 环境变量未配置。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
  }
}

assertSupabaseConfig();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
