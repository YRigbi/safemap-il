'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setGroupName(d.group?.name ?? '')
          setState('success')
          setTimeout(() => router.push('/'), 2500)
        } else {
          setState('error')
        }
      })
      .catch(() => setState('error'))
  }, [token, router])

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
      <div className="text-center">
        {state === 'loading' && <>
          <div className="text-5xl mb-4 animate-pulse">🔗</div>
          <p className="text-gray-400">מצטרף לקבוצה...</p>
        </>}
        {state === 'success' && <>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">הצטרפת ל-{groupName}!</h2>
          <p className="text-gray-400 text-sm">מועבר לאפליקציה...</p>
        </>}
        {state === 'error' && <>
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">לינק לא תקין</h2>
          <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-blue-600 rounded-xl text-sm font-bold">
            חזרה לאפליקציה
          </button>
        </>}
      </div>
    </div>
  )
}
