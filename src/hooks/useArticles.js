import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabase';

// CRUD for the signed-in user's articles. The list view only needs metadata;
// full blocks are fetched on demand via getArticle when opening the editor.
export function useArticles(userId) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await sb.from('articles')
      .select('id, title, subtitle, published, updated_at, published_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createArticle = useCallback(async () => {
    // `blocks` is NOT NULL — start with an empty TipTap doc.
    const { data, error } = await sb.from('articles')
      .insert({ user_id: userId, title: 'Untitled', blocks: { type: 'doc', content: [] } })
      .select('id')
      .single();
    if (error) { console.error('createArticle failed:', error); return { id: null, error }; }
    await refresh();
    return { id: data.id, error: null };
  }, [userId, refresh]);

  const getArticle = useCallback(async (id) => {
    const { data } = await sb.from('articles').select('*').eq('id', id).maybeSingle();
    return data;
  }, []);

  const saveArticle = useCallback(async (id, fields) => {
    const { error } = await sb.from('articles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) refresh();
    return { error };
  }, [refresh]);

  const setPublished = useCallback(async (id, published) => {
    const fields = { published, updated_at: new Date().toISOString() };
    if (published) fields.published_at = new Date().toISOString();
    const { error } = await sb.from('articles').update(fields).eq('id', id);
    if (!error) refresh();
    return { error };
  }, [refresh]);

  const deleteArticle = useCallback(async (id) => {
    const { error } = await sb.from('articles').delete().eq('id', id);
    if (!error) refresh();
    return { error };
  }, [refresh]);

  return { articles, loading, refresh, createArticle, getArticle, saveArticle, setPublished, deleteArticle };
}
