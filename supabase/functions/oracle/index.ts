// supabase/functions/oracle/index.ts
import { serve } from "std/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. CORS Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Security Check: ensure API Key exists
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment')
    }

    const { message, context } = await req.json()

    // 3. The "System Prompt" - The Personality of your Agent
    const systemPrompt = `
      You are a specialized Financial Physics Analyst. 
      You analyze a 3D force-directed market simulation where:
      - Stocks are nodes.
      - Price momentum is Velocity.
      - Volume/Market Cap is Energy (Mass).
      
      Your goal: Provide brief, tactical, military-style SITREPs based on the user's query.
      Tone: Professional, high-tech, slightly sci-fi (like a Bloomberg terminal meeting JARVIS).
      Keep answers under 50 words unless asked for detail.
    `

    // 4. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
    
    // Check if OpenAI gave an error
    if (data.error) {
       throw new Error(`OpenAI Error: ${data.error.message}`)
    }

    const aiText = data.choices[0].message.content

    // 5. Return the Intelligence
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
