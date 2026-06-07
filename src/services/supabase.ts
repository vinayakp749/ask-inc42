import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { Article, SearchResult } from '../types';

export const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export async function searchArticles(embedding: number[], query: string, limit = 5): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('hybrid_search', {
    query_embedding: embedding,
    query_text: query,
    match_count: limit,
  });
  if (error) { console.error('Search error:', error.message); return []; }
  return data || [];
}

export async function insertArticle(
  article: Omit<Article, 'id' | 'created_at'> & { embedding: number[] }
): Promise<Article> {
  const { data, error } = await supabase.from('articles').insert(article).select().single();
  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data;
}

export async function articleExists(url: string): Promise<boolean> {
  const { data } = await supabase.from('articles').select('id').eq('url', url).single();
  return !!data;
}
