import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/history?from=2025-02-28&userId=optional
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? '2025-02-28'
  const targetUserId = searchParams.get('userId') ?? session.user.id

  // Locations
  const { data: locations } = await supabaseAdmin
    .from('user_locations')
    .select('id, city_name, status, recorded_at')
    .eq('user_id', targetUserId)
    .gte('recorded_at', new Date(from).toISOString())
    .order('recorded_at', { ascending: false })
    .limit(200)

  // Shelter sessions
  const { data: shelterSessions } = await supabaseAdmin
    .from('shelter_sessions')
    .select('id, city_name, entered_at, exited_at, duration_mins')
    .eq('user_id', targetUserId)
    .gte('entered_at', new Date(from).toISOString())
    .order('entered_at', { ascending: false })

  // Aggregate: total shelter minutes per day
  const shelterByDay: Record<string, number> = {}
  shelterSessions?.forEach(s => {
    const day = s.entered_at.slice(0, 10)
    shelterByDay[day] = (shelterByDay[day] ?? 0) + (s.duration_mins ?? 0)
  })

  const totalShelterMins = Object.values(shelterByDay).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    locations: locations ?? [],
    shelterSessions: shelterSessions ?? [],
    shelterByDay,
    totalShelterMins,
  })
}
