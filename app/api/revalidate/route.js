import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { slug } = await req.json();

  // Revalidate specific charity page
  if (slug) {
    revalidatePath(`/charities/${slug}`);
  }
  // Always revalidate the listing page too
  revalidatePath('/charities');

  return NextResponse.json({ revalidated: true });
}