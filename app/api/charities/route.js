// app/api/charities/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

// GET - public route, list all charities OR single by slug/id
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const featured = searchParams.get('featured') === 'true';
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  const adminMode = searchParams.get('admin') === 'true';

  // Single charity detail (visitor page)
  if (slug || id) {
    let query = supabaseAdmin.from('charities').select('*');
    if (slug) query = query.eq('slug', slug);
    else query = query.eq('id', id);
    if (!adminMode) query = query.eq('is_active', true);
    const { data: charity, error } = await query.single();
    if (error || !charity) {
      return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
    }
    return NextResponse.json({ charity });
  }

  // List all charities
  let query = supabaseAdmin
    .from('charities')
    .select('id, name, slug, description, short_bio, logo_url, banner_url, website, category, is_featured, is_active, total_raised, upcoming_events, impact_stats, gallery_urls, content, founded_year, registered_number, contact_email, social_links, meta_title, meta_description, published_at, created_at, updated_at')
    .order('is_featured', { ascending: false })
    .order('name');

  if (!adminMode) query = query.eq('is_active', true);
  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('category', category);
  if (featured) query = query.eq('is_featured', true);

  const { data: charities, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch charities' }, { status: 500 });
  }

  return NextResponse.json({ charities });
}

// POST - admin only, create charity
export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      name, description, short_bio, category, website,
      logo_url, banner_url, gallery_urls, content,
      isFeatured, upcomingEvents, impact_stats,
      founded_year, registered_number, contact_email,
      social_links, meta_title, meta_description, slug,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Charity name is required' }, { status: 400 });
    }

    const { data: charity, error: dbError } = await supabaseAdmin
      .from('charities')
      .insert({
        name,
        slug: slug || null, // trigger auto-generates if null
        description,
        short_bio,
        category,
        website,
        logo_url,
        banner_url,
        gallery_urls: gallery_urls || [],
        content: content || [],
        is_featured: isFeatured || false,
        upcoming_events: upcomingEvents || [],
        impact_stats: impact_stats || [],
        founded_year,
        registered_number,
        contact_email,
        social_links: social_links || {},
        meta_title,
        meta_description,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Create charity error:', dbError);
      return NextResponse.json({ error: 'Failed to create charity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, charity });
  } catch (err) {
    console.error('POST /api/charities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - admin only, update charity
export async function PUT(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      id, name, slug, description, short_bio, category, website,
      logo_url, banner_url, gallery_urls, content,
      isFeatured, isActive, upcomingEvents, impact_stats,
      founded_year, registered_number, contact_email,
      social_links, meta_title, meta_description,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Charity ID required' }, { status: 400 });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (short_bio !== undefined) updateData.short_bio = short_bio;
    if (category !== undefined) updateData.category = category;
    if (website !== undefined) updateData.website = website;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (gallery_urls !== undefined) updateData.gallery_urls = gallery_urls;
    if (content !== undefined) updateData.content = content;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (upcomingEvents !== undefined) updateData.upcoming_events = upcomingEvents;
    if (impact_stats !== undefined) updateData.impact_stats = impact_stats;
    if (founded_year !== undefined) updateData.founded_year = founded_year;
    if (registered_number !== undefined) updateData.registered_number = registered_number;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (social_links !== undefined) updateData.social_links = social_links;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;

    const { data: charity, error: dbError } = await supabaseAdmin
      .from('charities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Update charity error:', dbError);
      return NextResponse.json({ error: 'Failed to update charity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, charity });
  } catch (err) {
    console.error('PUT /api/charities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - admin only (soft delete)
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
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to deactivate charity' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
