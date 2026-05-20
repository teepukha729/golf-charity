import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// GET - public route, list all charities
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const featured = searchParams.get('featured') === 'true';

  let query = supabaseAdmin
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (featured) {
    query = query.eq('is_featured', true);
  }

  const { data: charities, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch charities' }, { status: 500 });
  }

  return NextResponse.json({ charities });
}

// POST - admin only, create charity
export async function POST(req) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, description, category, website, logo_url, banner_url, isFeatured, upcomingEvents } = body;

    if (!name) {
      return NextResponse.json({ error: 'Charity name is required' }, { status: 400 });
    }

    const { data: charity, error: dbError } = await supabaseAdmin
      .from('charities')
      .insert({
        name,
        description,
        category,
        website,
        logo_url: logo_url,
        banner_url: banner_url,
        is_featured: isFeatured || false,
        upcoming_events: upcomingEvents || [],
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to create charity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, charity });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - admin only, update charity
export async function PUT(req) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, name, description, category, website, logo_url, banner_url, isFeatured, isActive, upcomingEvents } = body;

    if (!id) {
      return NextResponse.json({ error: 'Charity ID required' }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (website !== undefined) updateData.website = website;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (upcomingEvents !== undefined) updateData.upcoming_events = upcomingEvents;

    const { data: charity, error: dbError } = await supabaseAdmin
      .from('charities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update charity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, charity });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - admin only
export async function DELETE(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Charity ID required' }, { status: 400 });
  }

  const { error: dbError } = await supabaseAdmin
    .from('charities')
    .update({ is_active: false })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to delete charity' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
