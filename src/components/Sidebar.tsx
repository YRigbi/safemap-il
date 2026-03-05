'use client'
import { useState } from 'react'
import type { Friend, Group, City, ShelterSession, LocationHistory, UserStatus } from '@/types/database'
import { STATUS_CONFIG, LEVEL_CONFIG, getCityAlertLevel } from '@/lib/cities'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface Props {
  cities:          City[]
  groups:          Group[]
  activeGroupId:   string | null
  activeAlerts:    string[]
  onSelectGroup:   (id: string | null) => void
  onCreateGroup:   (name: string, icon: string) => void
  onUpdateStatus:  (city: string, status: UserStatus) => void
  myCity:          string
  myStatus:        UserStatus
  locationHistory: LocationHistory[]
  shelterSessions: ShelterSession[]
  shelterByDay:    Record<string, number>
  totalShelterMins:number
  onFocusFriend:   (f: Friend) => void
  isOpen:          boolean
  onClose:         () => void
}

type Tab = 'friends' | 'history' | 'shelter'

const GROUP_ICONS = ['👨‍👩‍👧','💼','🤝','🏫','⚽','🏠','🎓','🎯','🌟','🔵']

export default function Sidebar({
  cities, groups, activeGroupId, activeAlerts,
  onSelectGroup, onCreateGroup, onUpdateStatus,
  myCity, myStatus,
  locationHistory, shelterSessions, shelterByDay, totalShelterMins,
  onFocusFriend, isOpen, onClose,
}: Props) {
  const [tab,          setTab]          = useState<Tab>('friends')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newIcon,      setNewIcon]      = useState('👥')
  const [showInvite,   setShowInvite]   = useState<string | null>(null)

  const cityData = (name: string) => cities.find(c => c.name === name)

  const activeGroup = groups.find(g => g.id === activeGroupId) ?? null
  const visibleFriends: Friend[] = activeGroup
    ? activeGroup.members
    : groups.flatMap(g => g.members).filter((f, i, a) => a.findIndex(x => x.id === f.id) === i)

  // ── GROUP CHIPS ──────────────────────────────
  const GroupChips = () => (
    <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-border no-scrollbar flex-shrink-0">
      <button
        onClick={() => onSelectGroup(null)}
        className={`px-3 py-1 rounded-full text-xs font-bold border transition whitespace-nowrap
          ${!activeGroupId ? 'border-blue-400 text-blue-400 bg-blue-900/20' : 'border-border text-gray-400'}`}
      >
        🌍 הכל
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onSelectGroup(g.id === activeGroupId ? null : g.id)}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition whitespace-nowrap
            ${g.id === activeGroupId ? 'border-blue-400 text-blue-400 bg-blue-900/20' : 'border-border text-gray-400'}`}
        >
          {g.icon} {g.name}
        </button>
      ))}
      <button
        onClick={() => setShowNewGroup(true)}
        className="px-3 py-1 rounded-full text-xs font-bold border border-dashed border-border text-gray-500 whitespace-nowrap hover:border-blue-400 transition"
      >
        + קבוצה
      </button>
    </div>
  )

  // ── MY STATUS BAR ────────────────────────────
  const MyStatusBar = () => {
    const city = cityData(myCity)
    const level = city ? getCityAlertLevel(city, activeAlerts) : 'green'
    const lc = LEVEL_CONFIG[level]
    return (
      <div className="px-3 py-2 bg-surface2 border-b border-border flex-shrink-0">
        <div className="text-[11px] text-gray-500 font-bold mb-1">📍 המיקום שלי</div>
        <select
          value={myCity}
          onChange={e => onUpdateStatus(e.target.value, myStatus)}
          className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-white font-medium mb-2"
        >
          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {(Object.entries(STATUS_CONFIG) as [UserStatus, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([s, cfg]) => (
            <button
              key={s}
              onClick={() => onUpdateStatus(myCity, s)}
              style={{ background: myStatus === s ? cfg.bg : undefined, borderColor: myStatus === s ? cfg.color : undefined, color: myStatus === s ? cfg.color : undefined }}
              className="flex-1 py-1 rounded-lg border border-border text-gray-400 text-[11px] font-bold transition"
            >
              {cfg.icon}
            </button>
          ))}
        </div>
        <div className="mt-2 text-[11px]" style={{ color: lc.color }}>
          {lc.label} · {city?.migun_time ?? 90}ש׳ למרחב
        </div>
      </div>
    )
  }

  // ── TABS ─────────────────────────────────────
  const tabs: [Tab, string][] = [['friends', '👥 חברים'], ['history', '📜 היסטוריה'], ['shelter', '⏱️ מרחב']]

  // ── FRIENDS TAB ──────────────────────────────
  const FriendsTab = () => (
    <div className="space-y-2">
      {visibleFriends.length === 0 && (
        <div className="text-center text-gray-500 py-10 text-sm">אין חברים בקבוצה זו</div>
      )}
      {visibleFriends.map(f => {
        const sc   = STATUS_CONFIG[f.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.safe
        const city = cityData(f.city_name)
        const level = city ? getCityAlertLevel(city, activeAlerts) : 'green'
        const lc   = LEVEL_CONFIG[level]
        return (
          <div
            key={f.id}
            className="bg-surface2 border border-border rounded-xl p-3 cursor-pointer hover:border-blue-500/50 transition"
            onClick={() => onFocusFriend(f)}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: sc.bg, border: `2px solid ${sc.color}` }}
              >
                {f.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{f.name}</div>
                <div className="text-xs text-gray-500 truncate">📍 {f.city_name || '—'}</div>
              </div>
              <div className="text-right">
                <span className={`badge ${lc.badgeClass} block mb-1 text-[10px]`}>{lc.label}</span>
                <span className="badge badge-blue text-[10px]">{city?.migun_time ?? '?'}ש׳</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span style={{ color: sc.color }} className="text-base">{sc.icon}</span>
              <span style={{ color: sc.color }} className="text-xs font-bold">{sc.label}</span>
              {f.recorded_at && (
                <span className="text-gray-600 text-[10px] mr-auto">
                  {format(new Date(f.recorded_at), 'HH:mm', { locale: he })}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* Group management */}
      {activeGroup && (
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setShowInvite(activeGroup.invite_token)}
            className="w-full py-2.5 rounded-xl border border-blue-500/40 text-blue-400 text-sm font-bold hover:bg-blue-900/20 transition"
          >
            🔗 שלח לינק הצטרפות
          </button>
        </div>
      )}

      {/* New group modal */}
      {showNewGroup && (
        <div className="bg-surface2 border border-blue-500/50 rounded-xl p-3 mt-2">
          <div className="text-sm font-bold mb-2">קבוצה חדשה</div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="שם הקבוצה..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white mb-2 placeholder-gray-600"
          />
          <div className="flex flex-wrap gap-1.5 mb-2">
            {GROUP_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setNewIcon(ic)}
                className={`text-lg p-1 rounded-lg ${newIcon === ic ? 'bg-blue-900/50 ring-1 ring-blue-400' : 'hover:bg-surface'}`}
              >
                {ic}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { if (newName.trim()) { onCreateGroup(newName.trim(), newIcon); setShowNewGroup(false); setNewName('') } }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition"
            >
              צור קבוצה
            </button>
            <button
              onClick={() => setShowNewGroup(false)}
              className="flex-1 py-2 bg-surface border border-border rounded-lg text-sm text-gray-400 hover:text-white transition"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Invite link */}
      {showInvite && (
        <div className="bg-surface2 border border-blue-500/50 rounded-xl p-3 mt-2">
          <div className="text-sm font-bold mb-2">🔗 לינק הצטרפות</div>
          <div className="bg-surface rounded-lg p-2 text-xs text-gray-400 break-all mb-2 select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/join/${showInvite}` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/join/${showInvite}`) }}
              className="flex-1 py-2 bg-blue-600 rounded-lg text-xs font-bold"
            >📋 העתק</button>
            <button
              onClick={() => setShowInvite(null)}
              className="flex-1 py-2 bg-surface border border-border rounded-lg text-xs text-gray-400"
            >סגור</button>
          </div>
        </div>
      )}
    </div>
  )

  // ── HISTORY TAB ──────────────────────────────
  const HistoryTab = () => (
    <div className="space-y-3">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">היסטוריית מיקומים</div>
      {visibleFriends.map(f => (
        <div key={f.id} className="bg-surface2 border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-black"
              style={{ color: STATUS_CONFIG[f.status as keyof typeof STATUS_CONFIG]?.color ?? '#fff' }}>
              {f.name.slice(0,2)}
            </div>
            <span className="font-bold text-sm">{f.name}</span>
          </div>
          {/* Latest locations */}
          <div className="space-y-1">
            {[f].map(fr => (
              <div key="loc" className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium truncate">{fr.city_name || '—'}</span>
                <span className="text-gray-600 flex-shrink-0 mr-2">
                  {fr.recorded_at ? format(new Date(fr.recorded_at), 'dd/MM HH:mm') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* My full history */}
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-4">ההיסטוריה שלי</div>
      {locationHistory.slice(0, 30).map(h => {
        const sc = STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.safe
        return (
          <div key={h.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
            <span className="text-base">{sc.icon}</span>
            <div className="flex-1">
              <div className="text-xs font-semibold">{h.city_name}</div>
              <div className="text-[10px] text-gray-600">{format(new Date(h.recorded_at), 'dd/MM/yyyy HH:mm')}</div>
            </div>
            <span style={{ color: sc.color }} className="text-[10px] font-bold">{sc.label}</span>
          </div>
        )
      })}
    </div>
  )

  // ── SHELTER TAB ──────────────────────────────
  const ShelterTab = () => {
    const daysWithShelter = Object.values(shelterByDay).filter(v => v > 0).length
    const maxMins = Math.max(...Object.values(shelterByDay), 1)
    return (
      <div className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: totalShelterMins.toString() + '′', label: 'סה"כ דקות' },
            { num: daysWithShelter.toString(),         label: 'ימים עם כניסה' },
            { num: shelterSessions.length.toString(),  label: 'כניסות' },
          ].map(s => (
            <div key={s.label} className="bg-surface2 border border-border rounded-xl p-2.5 text-center">
              <div className="text-xl font-black text-blue-400">{s.num}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart by day */}
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">דקות מרחב לפי יום</div>
        {Object.entries(shelterByDay).sort().map(([day, mins]) => (
          <div key={day} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{format(new Date(day), 'dd/MM', { locale: he })}</span>
              <span className="text-blue-400 font-bold">{mins}′</span>
            </div>
            <div className="h-3 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.round(mins / maxMins * 100)}%` }}
              />
            </div>
          </div>
        ))}

        {/* Sessions */}
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-4">כניסות למרחב</div>
        {shelterSessions.map(s => (
          <div key={s.id} className="bg-surface2 border border-border rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-bold">{s.city_name}</div>
              <div className="text-[11px] text-gray-500">
                {format(new Date(s.entered_at), 'dd/MM HH:mm')}
                {s.exited_at ? ` → ${format(new Date(s.exited_at), 'HH:mm')}` : ' → עדיין בפנים'}
              </div>
            </div>
            <span className="badge badge-blue">{s.duration_mins ?? '?'}′</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <div className={`
        fixed md:relative top-0 right-0 h-full z-50 md:z-auto
        w-[320px] bg-surface border-l border-border
        flex flex-col overflow-hidden
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <GroupChips />
        <MyStatusBar />

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {tabs.map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition
                ${tab === t ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'friends'  && <FriendsTab />}
          {tab === 'history'  && <HistoryTab />}
          {tab === 'shelter'  && <ShelterTab />}
        </div>
      </div>
    </>
  )
}
