import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/groups — list my groups with members + their current location
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Groups I own or belong to
  const { data: memberRows } = await supabaseAdmin
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const { data: ownedGroups } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('owner_id', userId)

  const groupIds = [
    ...(memberRows?.map(r => r.group_id) ?? []),
    ...(ownedGroups?.map(r => r.id) ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  if (!groupIds.length) return NextResponse.json([])

  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('*, group_members(user_id)')
    .in('id', groupIds)

  // Enrich with member details + current location
  const enriched = await Promise.all((groups ?? []).map(async g => {
    const memberIds: string[] = (g.group_members as {user_id:string}[]).map(m => m.user_id)

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', memberIds)

    // Latest location per member
    const { data: locs } = await supabaseAdmin
      .from('user_locations')
      .select('user_id, city_name, status, lat, lng, recorded_at')
      .in('user_id', memberIds)
      .order('recorded_at', { ascending: false })

    const latestLoc: Record<string, typeof locs extends (infer T)[] | null ? T : never> = {}
    locs?.forEach(l => { if (!latestLoc[l.user_id]) latestLoc[l.user_id] = l })

    const members = (users ?? []).map(u => ({
      ...u,
      ...(latestLoc[u.id] ?? { city_name: null, status: 'unknown', lat: null, lng: null, recorded_at: null }),
    }))

    return { ...g, members }
  }))

  return NextResponse.json(enriched)
}

// POST /api/groups — create group
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, icon } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('groups')
    .insert({ name, icon: icon ?? '👥', owner_id: session.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-add creator as member
  await supabaseAdmin.from('group_members').insert({ group_id: data.id, user_id: session.user.id })

  return NextResponse.json(data)
}
