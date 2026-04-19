'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!email || !password) {
      setMessage('❌ Введи email і пароль')
      return
    }

    if (!email.includes('@')) {
      setMessage('❌ Невірний email')
      return
    }

    if (password.length < 6) {
      setMessage('❌ Пароль мінімум 6 символів')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('✅ Реєстрація успішна!')

      // 🔥 редірект на логін
      setTimeout(() => {
        router.push('/login')
      }, 800)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h1>Register</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
        style={{ width: '100%', padding: 8 }}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
        style={{ width: '100%', padding: 8 }}
      />

      <br /><br />

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        {loading ? 'Loading...' : 'Register'}
      </button>

      <p>{message}</p>
    </div>
  )
}