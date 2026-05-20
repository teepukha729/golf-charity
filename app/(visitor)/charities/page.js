import { supabaseAdmin } from '@/lib/supabase';
import CharitiesClient from '@/components/visitor/CharitiesClient';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Charities | Golf Charity Platform',
  description: 'Browse and discover the charities supported by Golf Charity Platform. Choose your cause and make a difference with every golf round.',
};

async function getCharities() {
  const { data, error } = await supabaseAdmin
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name');
  if (error) return [];
  return data || [];
}

async function getCategories() {
  const { data } = await supabaseAdmin
    .from('charities')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);
  const cats = [...new Set(data?.map(d => d.category).filter(Boolean))];
  return cats.sort();
}

export default async function CharitiesPage() {
  const [charities, categories] = await Promise.all([getCharities(), getCategories()]);
  return <CharitiesClient initialCharities={charities} categories={categories} />;
}
