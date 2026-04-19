'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  // 🔥 INIT
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null

      setUserId(uid)
      if (!uid) return

      const { data: chatsData } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      let currentChatId = chatsData?.[0]?.id

      // 🔥 якщо нема — створюємо чат З ПЕРЕВІРКОЮ
      if (!currentChatId) {
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert([
            {
              user_id: uid,
              title: 'Новий чат',
              system_prompt: 'Звичайний чат',
            },
          ])
          .select()
          .single()

        console.log('NEW CHAT:', newChat)
        console.log('ERROR:', error)

        if (error || !newChat) {
          alert('❌ Не вдалося створити чат (перевір Supabase)')
          return
        }

        currentChatId = newChat.id
      }

      console.log('✅ CHAT READY:', currentChatId)

      setChatId(currentChatId)

      // оновлюємо список чатів
      const { data: updatedChats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      setChats(updatedChats || [])

      // повідомлення
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
    }

    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 🔥 SELECT CHAT
  const selectChat = async (id: string) => {
    setChatId(id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })

    setMessages(msgs || [])
  }

  // 🔥 NEW CHAT
  const createNewChat = async () => {
    if (!userId) return

    const promptText = prompt('Для чого цей чат?')
    if (!promptText) return

    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          user_id: userId,
          title: promptText,
          system_prompt: promptText,
        },
      ])
      .select()
      .single()

    if (error || !data) {
      console.error(error)
      alert('❌ Не вдалося створити чат')
      return
    }

    console.log('🆕 NEW CHAT:', data.id)

    setChatId(data.id)
    setMessages([])

    const { data: chatsData } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setChats(chatsData || [])
  }

  // 🔥 SEND
  async function sendMessage() {
    console.log('DATA:', { message, userId, chatId })

    if (!message) return
    if (!userId) return
    if (!chatId) {
      alert('⏳ Чат ще створюється...')
      return
    }

    setLoading(true)

    const newMessages = [
      ...messages,
      { role: 'user', content: message },
    ]

    setMessages(newMessages)
    setMessage('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          user_id: userId,
          chat_id: chatId,
        }),
      })

      const data = await res.json()

      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.reply },
      ])
    } catch (err) {
      console.error(err)

      setMessages([
        ...newMessages,
        { role: 'assistant', content: '❌ Помилка сервера' },
      ])
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      
      <div style={{ width: 220, borderRight: '1px solid gray', padding: 10 }}>
        <button onClick={createNewChat}>
          + Новий чат
        </button>

        <h3>Чати</h3>

        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => selectChat(chat.id)}
            style={{
              cursor: 'pointer',
              padding: 5,
              background: chat.id === chatId ? '#ddd' : 'transparent',
            }}
          >
            {chat.title}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column' }}>
        <h1>AI Chat 🤖</h1>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.role === 'user' ? 'right' : 'left',
                margin: '10px 0',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 10,
                  background:
                    msg.role === 'user' ? '#007bff' : '#e5e5ea',
                  color: msg.role === 'user' ? 'white' : 'black',
                }}
              >
                {msg.content}
              </span>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          placeholder="Напиши щось..."
        />

        <button onClick={sendMessage} disabled={loading || !chatId}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}