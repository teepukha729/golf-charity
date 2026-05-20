import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAdmin();

  if (error) {
    return error;
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('users')
    .select(
      `
        *,
        subscriptions (
          id,
          plan,
          status,
          current_period_end
        ),
        golf_scores (
          id,
          score,
          played_at
        ),
        user_charities (
          contribution_percentage,
          charities (
            name
          )
        )
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safeSearch = search.trim();

    query = query.or(
      `email.ilike.%${safeSearch}%,first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%`
    );
  }

  const {
    data: users,
    count,
    error: dbError,
  } = await query;

  if (dbError) {
    console.error('ADMIN USERS FETCH ERROR:', dbError);

    return NextResponse.json(
      {
        error: 'Failed to fetch users',
      },
      {
        status: 500,
      }
    );
  }

  const formattedUsers = (users || []).map((u) => {
    const subscriptions = Array.isArray(u.subscriptions)
      ? u.subscriptions
      : u.subscriptions
        ? [u.subscriptions]
        : [];

    const golfScores = Array.isArray(u.golf_scores)
      ? u.golf_scores
      : [];

    const charities = Array.isArray(u.user_charities)
      ? u.user_charities
      : [];

    const activeSubscription =
      subscriptions.find(
        (s) => s.status === 'active'
      ) || null;

    const {
      password_hash,
      ...safeUser
    } = u;

    return {
      ...safeUser,

      subscriptions,

      golf_scores: golfScores,

      user_charities: charities,

      activeSubscription,

      scoreCount: golfScores.length,

      hasActiveSubscription:
        !!activeSubscription,
    };
  });

  return NextResponse.json({
    users: formattedUsers,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil(
      (count || 0) / limit
    ),
  });
}

export async function PUT(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, firstName, lastName, email, isActive, role } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const updateData = {};

    if (firstName !== undefined) {
      updateData.first_name = firstName;
    }

    if (lastName !== undefined) {
      updateData.last_name = lastName;
    }

    if (email !== undefined) {
      updateData.email = email.toLowerCase();
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hasChanges =
      (firstName !== undefined && existingUser.first_name !== firstName) ||
      (lastName !== undefined && existingUser.last_name !== lastName) ||
      (email !== undefined && existingUser.email !== email.toLowerCase()) ||
      (isActive !== undefined && existingUser.is_active !== isActive) ||
      (role !== undefined && existingUser.role !== role);

    if (!hasChanges) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        user: {
          ...existingUser,
          password_hash: undefined
        }
      });
    }

    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        password_hash: undefined
      }
    });

  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
