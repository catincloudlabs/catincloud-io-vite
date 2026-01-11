// supabase/functions/oracle/index.ts
import { serve } from "std/http/server.ts"
import { OPENAI_API_KEY } from "./keys.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // We now have the key guaranteed from the file
    if (!OPENAI_API_KEY) {
      throw new Error('Missing API Key in keys.ts')
    }

    const { message, context } = await req.json()

    const systemPrompt = `
      You are a specialized Financial Physics Analyst. 
      You analyze a 3D force-directed market simulation where:
      - Stocks are nodes.
      - Price momentum is Velocity.
      - Volume/Market Cap is Energy (Mass).
      
      Your goal: Provide brief, tactical, military-style SITREPs based on the user's query.
      Tone: Professional, high-tech, slightly sci-fi.
      Keep answers under 50 words.
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${context || 'No specific data provided.'}\n\nUser Query: ${message}` }
        ],
        temperature: 0.7, 
      }),
    })

    const data = await response.json()
    
    if (data.error) {
       throw new Error(`OpenAI Error: ${data.error.message}`)
    }

    const aiText = data.choices[0].message.content

    return new Response(JSON.stringify({ reply: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    })
  }
})
