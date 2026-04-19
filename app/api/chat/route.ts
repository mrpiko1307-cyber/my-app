import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('API HIT')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { message, user_id, chat_id } = await req.json()

    if (!message || !user_id || !chat_id) {
      return Response.json(
        { reply: '❌ Невірні дані' },
        { status: 400 }
      )
    }

    // 🔥 отримуємо system prompt чату
    const { data: chat } = await supabase
      .from('chats')
      .select('system_prompt')
      .eq('id', chat_id)
      .single()

    const systemPrompt = chat?.system_prompt || 'Звичайний чат'

    // 🔹 зберігаємо повідомлення юзера
    const { error: userError } = await supabase.from('messages').insert([
      {
        user_id,
        chat_id,
        role: 'user',
        content: message,
      },
    ])

    if (userError) {
      console.error(userError)
      throw new Error('DB ERROR')
    }

    // 🔥 ІМІТАЦІЯ AI З УРАХУВАННЯМ system prompt
    const reply = `🤖 (${systemPrompt}) відповідає: "${message}"`

    // 🔹 зберігаємо відповідь AI
    const { error: botError } = await supabase.from('messages').insert([
      {
        user_id,
        chat_id,
        role: 'assistant',
        content: reply,
      },
    ])

    if (botError) {
      console.error(botError)
      throw new Error('DB ERROR')
    }

    return Response.json({ reply })
  } catch (err: any) {
    console.error('SERVER ERROR:', err)

    return Response.json(
      { reply: '❌ Помилка сервера' },
      { status: 500 }
    )
  }
}