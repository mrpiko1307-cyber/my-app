'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        // ❗ якщо не залогінений — кидає на login
        router.push('/login')
      } else {
        setEmail(data.user.email ?? null)
      }
    }

    getUser()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard 🚀</h1>

      <p>Привіт, {email}</p>

      <br />

      <button onClick={handleLogout}>
        Вийти
      </button>
    </div>
  )
}