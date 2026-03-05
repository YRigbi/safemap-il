import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/friends — update my location/status (inserts new history row)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { city_name, status, lat, lng } = await req.json()
  if (!city_name || !status) return NextResponse.json({ error: 'city_name and status required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('user_locations')
    .insert({ user_id: session.user.id, city_name, status, lat: lat ?? null, lng: lng ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If entering shelter, open a shelter session
  if (status === 'shelter') {
    // Close any open session first
    await supabaseAdmin
      .from('shelter_sessions')
      .update({ exited_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .is('exited_at', null)

    await supabaseAdmin.from('shelter_sessions').insert({
      user_id:    session.user.id,
      city_name,
      entered_at: new Date().toISOString(),
    })
  } else {
    // Close any open shelter session
    await supabaseAdmin
      .from('shelter_sessions')
      .update({ exited_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .is('exited_at', null)
  }

  return NextResponse.json(data)
}
