'use client'
import { Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">SafeMap IL</h1>
          <p className="text-gray-400 mt-2">עקוב אחר חברים בזמן אמת</p>
        </div>
        {error && <div className="bg-red-900 text-red-300 p-3 rounded mb-4 text-sm">שגיאה בהתחברות</div>}
        <div className="space-y-3">
          <button onClick={() => signIn('google', { callbackUrl: '/' })} className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition">המשך עם Google</button>
          <button onClick={() => signIn('facebook', { callbackUrl: '/' })} className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition">המשך עם Facebook</button>
          <button onClick={() => signIn('linkedin', { callbackUrl: '/' })} className="w-full bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-800 transition">המשך עם LinkedIn</button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-white">טוען...</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
