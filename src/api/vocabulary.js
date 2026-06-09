import { getSupabase } from './supabaseClient.js';

export async function listVocabulary({ limit = 120 } = {}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'list_vocabulary', payload: { limit } }
  });

  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'list_vocabulary failed');
  return data?.data ?? data ?? [];
}
