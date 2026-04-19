'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setMessage('❌ Введи email і пароль')
      return
    }

    if (!email.includes('@')) {
      setMessage('❌ Невірний email')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Успішний вхід! 🚀')

      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        style={{ width: '100%', padding: 8 }}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        style={{ width: '100%', padding: 8 }}
      />

      <br /><br />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        {loading ? 'Loading...' : 'Login'}
      </button>

      <p>{message}</p>
    </div>
  )
}