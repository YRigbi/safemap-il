import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const OREF_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json'

export const revalidate = 0 // no cache

export async function GET() {
  try {
    const res = await fetch(OREF_URL, {
      headers: {
        'Referer':     'https://www.oref.org.il/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 0 },
    })

    const text = await res.text()
    const trimmed = text?.trim()

    // No active alert
    if (!trimmed || trimmed === '\r' || trimmed === '') {
      return NextResponse.json({ active: false, cities: [], title: null })
    }

    const data = JSON.parse(trimmed)
    const cities: string[] = Array.isArray(data.data) ? data.data : []

    // Persist to Supabase if new alert
    if (cities.length > 0) {
      await supabaseAdmin.from('oref_alerts').insert({
        alert_id:    data.id ?? null,
        cities,
        title:       data.title ?? null,
        description: data.desc ?? null,
        category:    data.cat ? parseInt(data.cat) : null,
      })
    }

    return NextResponse.json({
      active: cities.length > 0,
      cities,
      title:  data.title ?? null,
      desc:   data.desc ?? null,
      id:     data.id ?? null,
    })
  } catch (err) {
    console.error('Oref fetch error:', err)
    return NextResponse.json({ active: false, cities: [], title: null, error: true }, { status: 200 })
  }
}
