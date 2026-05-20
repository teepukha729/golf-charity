// app/(visitor)/charities/[slug]/page.js
import { supabaseAdmin } from '@/lib/supabase';
import CharityDetailClient from '@/components/visitor/CharityDetailClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering — no cache
export const dynamic = 'force-dynamic';
// OR use ISR with short revalidation (better for production)
export const revalidate = 30; // re-fetch every 30 seconds

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: charity } = await supabaseAdmin
    .from('charities')
    .select('name, meta_title, meta_description, description, banner_url, logo_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!charity) return { title: 'Charity Not Found' };

  return {
    title: charity.meta_title || `${charity.name} | Golf Charity Platform`,
    description: charity.meta_description || charity.description,
    openGraph: {
      title: charity.meta_title || charity.name,
      description: charity.meta_description || charity.description,
      images: charity.banner_url ? [{ url: charity.banner_url }] : [],
    },
  };
}

async function getCharity(slug) {
  const { data, error } = await supabaseAdmin
    .from('charities')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

async function getRelatedCharities(category, currentId) {
  const { data } = await supabaseAdmin
    .from('charities')
    .select('id, name, slug, description, logo_url, banner_url, category, total_raised, is_featured')
    .eq('is_active', true)
    .eq('category', category)
    .neq('id', currentId)
    .limit(3);
  return data || [];
}

export default async function CharityDetailPage({ params }) {
  const { slug } = await params;
  const charity = await getCharity(slug);

  if (!charity) notFound();

  const related = charity.category
    ? await getRelatedCharities(charity.category, charity.id)
    : [];

  return <CharityDetailClient charity={charity} relatedCharities={related} />;
}
