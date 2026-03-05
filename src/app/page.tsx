'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { City, Group, Friend, ShelterSession, LocationHistory, UserStatus } from '@/types/database'
import Sidebar from '@/components/Sidebar'
import { LEVEL_CONFIG } from '@/lib/cities'

// Load LeafletMap only client-side (window dependency)
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false })

export default function HomePage() {
  const router = useRouter()

  // Auth check
  const [userId,   setUserId]   = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => {
        if (!s?.user) { router.push('/login'); return }
        setUserId(s.user.id)
        setUserName(s.user.name ?? '')
      })
  }, [router])

  // Data
  const [cities,       setCities]       = useState<City[]>([])
  const [groups,       setGroups]       = useState<Group[]>([])
  const [activeAlerts, setActiveAlerts] = useState<string[]>([])
  const [alertTitle,   setAlertTitle]   = useState<string | null>(null)
  const [myCity,       setMyCity]       = useState('תל אביב - מרכז העיר')
  const [myStatus,     setMyStatus]     = useState<UserStatus>('safe')
  const [activeGroup,  setActiveGroup]  = useState<string | null>(null)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)

  // History
  const [locationHistory,   setLocationHistory]   = useState<LocationHistory[]>([])
  const [shelterSessions,   setShelterSessions]   = useState<ShelterSession[]>([])
  const [shelterByDay,      setShelterByDay]      = useState<Record<string, number>>({})
  const [totalShelterMins,  setTotalShelterMins]  = useState(0)

  // Focus friend on map
  const [focusedFriend, setFocusedFriend] = useState<Friend | null>(null)
  const mapRef = useRef<{ focusOnFriend: (f: Friend) => void } | null>(null)

  // Clock
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  // Load cities
  useEffect(() => {
    fetch('/api/cities').then(r => r.json()).then(setCities)
  }, [])

  // Load groups
  const loadGroups = useCallback(() => {
    fetch('/api/groups').then(r => r.json()).then(d => { if (Array.isArray(d)) setGroups(d) })
  }, [])
  useEffect(() => { if (userId) loadGroups() }, [userId, loadGroups])

  // Poll Oref alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const data = await fetch('/api/alerts').then(r => r.json())
      setActiveAlerts(data.cities ?? [])
      setAlertTitle(data.active ? data.title : null)
    } catch {}
  }, [])
  useEffect(() => {
    fetchAlerts()
    const iv = setInterval(fetchAlerts, 10000)
    return () => clearInterval(iv)
  }, [fetchAlerts])

  // Load history
  useEffect(() => {
    if (!userId) return
    fetch('/api/history?from=2025-02-28')
      .then(r => r.json())
      .then(d => {
        setLocationHistory(d.locations ?? [])
        setShelterSessions(d.shelterSessions ?? [])
        setShelterByDay(d.shelterByDay ?? {})
        setTotalShelterMins(d.totalShelterMins ?? 0)
      })
  }, [userId])

  const handleUpdateStatus = useCallback(async (city: string, status: UserStatus) => {
    setMyCity(city)
    setMyStatus(status)
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_name: city, status }),
    })
    // Reload history
    const d = await fetch('/api/history?from=2025-02-28').then(r => r.json())
    setLocationHistory(d.locations ?? [])
    setShelterSessions(d.shelterSessions ?? [])
    setShelterByDay(d.shelterByDay ?? {})
    setTotalShelterMins(d.totalShelterMins ?? 0)
  }, [])

  const handleCreateGroup = useCallback(async (name: string, icon: string) => {
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon }),
    })
    loadGroups()
  }, [loadGroups])

  const alertLevel = activeAlerts.length > 0 ? 'red' : 'green'

  const allFriends = groups
    .flatMap(g => g.members)
    .filter((f, i, a) => a.findIndex(x => x.id === f.id) === i)

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-bg">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-lg"
            onClick={() => setSidebarOpen(o => !o)}
          >
            ☰
          </button>
          <div className="text-xl font-black">Safe<span className="text-blue-400">Map</span> 🛡️</div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full inline-block ${activeAlerts.length > 0 ? 'bg-red-500 animate-alert' : 'bg-green-500'}`}
          />
          <span className="text-gray-400 hidden sm:inline">
            {activeAlerts.length > 0 ? `🚨 ${activeAlerts.length} אזורים` : 'פיקוד העורף · עדכני'}
          </span>
        </div>

        <div className="text-gray-500 text-xs font-mono">{clock}</div>
      </div>

      {/* ALERT BANNER */}
      {activeAlerts.length > 0 && (
        <div className="animate-flash text-white px-4 py-2 text-sm font-bold z-40 flex-shrink-0">
          🚨 {alertTitle ?? 'התרעה פעילה'}: {activeAlerts.slice(0, 5).join(' • ')}{activeAlerts.length > 5 ? ' ועוד...' : ''}
        </div>
      )}

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 relative">
          {cities.length > 0 && (
            <LeafletMap
              cities={cities}
              friends={allFriends}
              activeAlerts={activeAlerts}
              onCityClick={() => {}}
            />
          )}

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-border rounded-xl p-3 text-xs space-y-1.5 z-10">
            {(Object.entries(LEVEL_CONFIG) as [string, typeof LEVEL_CONFIG[keyof typeof LEVEL_CONFIG]][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                <span className="text-gray-400">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <Sidebar
          cities={cities}
          groups={groups}
          activeGroupId={activeGroup}
          activeAlerts={activeAlerts}
          onSelectGroup={setActiveGroup}
          onCreateGroup={handleCreateGroup}
          onUpdateStatus={handleUpdateStatus}
          myCity={myCity}
          myStatus={myStatus}
          locationHistory={locationHistory}
          shelterSessions={shelterSessions}
          shelterByDay={shelterByDay}
          totalShelterMins={totalShelterMins}
          onFocusFriend={f => {
            const city = cities.find(c => c.name === f.city_name)
            if (city) {/* map pan handled inside LeafletMap via state */}
            setSidebarOpen(false)
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  )
}
