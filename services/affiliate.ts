import { supabase } from './supabaseClient';

export interface AffiliateProduct {
  id: string;
  title: string;
  image_url: string;
  price: number;
  affiliate_url: string;
  category: string | null;
  active: boolean;
  created_at: string;
}

export const getAffiliateProducts = async ({ category, limit }: { category?: string; limit?: number } = {}) => {
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (category && category !== 'Todos') {
    query = query.eq('category', category);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching affiliate products:', error);
    return [];
  }

  return data as AffiliateProduct[];
};

export const trackAffiliateClick = async (productId: string) => {
  const { error } = await supabase
    .from('affiliate_clicks')
    .insert({ product_id: productId });

  if (error) {
    console.error('Error tracking click:', error);
  }
};

export const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
