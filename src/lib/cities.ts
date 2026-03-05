import type { City } from '@/types/database'

export const STATUS_CONFIG = {
  safe:    { icon: '✅', label: 'בטוח/ה',      color: '#22c55e', bg: '#14532d' },
  shelter: { icon: '🏠', label: 'במרחב מוגן',  color: '#3b82f6', bg: '#1e3a5f' },
  moving:  { icon: '🏃', label: 'בדרך למרחב', color: '#f97316', bg: '#7c2d12' },
  help:    { icon: '🆘', label: 'צריך עזרה',   color: '#ef4444', bg: '#7f1d1d' },
} as const

export const LEVEL_CONFIG = {
  red:    { color: '#ef4444', label: '🚨 התרעה!',       badgeClass: 'badge-red'    },
  orange: { color: '#f97316', label: '⚠️ כוננות גבוהה', badgeClass: 'badge-orange' },
  yellow: { color: '#eab308', label: '🔔 כוננות',       badgeClass: 'badge-yellow' },
  green:  { color: '#22c55e', label: '✅ שגרה',          badgeClass: 'badge-green'  },
} as const

export type AlertLevel = keyof typeof LEVEL_CONFIG

export function migunToLevel(seconds: number): AlertLevel {
  if (seconds <= 15) return 'red'
  if (seconds <= 45) return 'orange'
  if (seconds <= 90) return 'yellow'
  return 'green'
}

export function getCityAlertLevel(city: City, activeAlertCities: string[]): AlertLevel {
  const inAlert = activeAlertCities.some(
    a => city.name === a || city.name.startsWith(a.split('-')[0].trim()) || a.startsWith(city.name.split(' - ')[0])
  )
  return inAlert ? 'red' : migunToLevel(city.migun_time)
}

export const GROUP_ICONS = ['👨‍👩‍👧', '💼', '🤝', '🏫', '⚽', '🏠', '🎓', '🎯', '🌟', '🔵']
