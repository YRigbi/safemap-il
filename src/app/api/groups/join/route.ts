import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/groups/join — join via invite token
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const { data: group } = await supabaseAdmin
    .from('groups')
    .select('id, name, icon')
    .eq('invite_token', token)
    .single()

  if (!group) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })

  await supabaseAdmin
    .from('group_members')
    .upsert({ group_id: group.id, user_id: session.user.id }, { onConflict: 'group_id,user_id' })

  return NextResponse.json({ success: true, group })
}
