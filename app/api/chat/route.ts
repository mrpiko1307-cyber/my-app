import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('API HIT')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 🔥 отримуємо дані
    const { message, user_id, chat_id } = await req.json()

    console.log('DATA:', message, user_id, chat_id)

    // 🔹 зберігаємо повідомлення користувача
    await supabase.from('messages').insert([
      {
        user_id,
        chat_id,
        role: 'user',
        content: message,
      },
    ])

    // 🔥 фейкова відповідь (працює без OpenAI)
    const reply = `Ти написав: "${message}" 🤖`

    // 🔹 зберігаємо відповідь AI
    await supabase.from('messages').insert([
      {
        user_id,
        chat_id,
        role: 'assistant',
        content: reply,
      },
    ])

    return Response.json({ reply })
  } catch (err: any) {
    console.error('SERVER ERROR:', err)

    return Response.json({
      reply: '❌ Помилка сервера',
    })
  }
}