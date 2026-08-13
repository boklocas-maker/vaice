import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function listSupabaseEvents(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return data || [];
}

export async function discoverSupabaseEvents(query: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${supabaseUrl}/functions/v1/discover-events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`A pesquisa falhou (${response.status}).`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { events?: unknown }).events)) {
    throw new Error('A pesquisa retornou uma resposta inválida.');
  }
  return (payload as { events: Record<string, unknown>[] }).events;
}
