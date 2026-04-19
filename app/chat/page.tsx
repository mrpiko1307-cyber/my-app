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

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null

      setUserId(uid)
      if (!uid) return

      const { data: chatsData } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      setChats(chatsData || [])

      let currentChatId = chatsData?.[0]?.id

      if (!currentChatId) {
        const { data: newChat } = await supabase
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

        currentChatId = newChat?.id
      }

      setChatId(currentChatId)

      if (currentChatId) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: true })
          .limit(20)

        setMessages(msgs || [])
      }
    }

    getData()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectChat = async (id: string) => {
    setChatId(id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
      .limit(20)

    setMessages(msgs || [])
  }

  const createNewChat = async () => {
    if (!userId) return

    const promptText = prompt('Для чого цей чат? (system prompt)')
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

    if (error) {
      console.error(error)
      return
    }

    const { data: chatsData } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setChats(chatsData || [])

    setChatId(data.id)
    setMessages([])
  }

  // 🔥 ОНОВЛЕНА ФУНКЦІЯ
  async function sendMessage() {
    console.log('DATA:', { message, userId, chatId })

    if (!message || !userId || !chatId) {
      console.log('❌ Missing data')
      return
    }

    setLoading(true)

    const newMessages = [
      ...messages,
      { role: 'user', content: message },
    ]

    setMessages(newMessages)
    setMessage('')

    // 🔥 "бот друкує"
    setMessages([
      ...newMessages,
      { role: 'assistant', content: '...друкує' },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        {/* 🔥 ВАЖЛИВО */}
        <button onClick={sendMessage} disabled={loading || !chatId}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}