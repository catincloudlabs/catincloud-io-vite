// supabase/functions/oracle/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Deno.serve is built globally into the Supabase Edge Runtime.
Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Securely get Key from Environment (NO keys.ts import)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY secret. Run: npx supabase secrets set OPENAI_API_KEY=...')
    }

    const { message, context } = await req.json()

    // 3. Define the Persona
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

    // 4. Call OpenAI
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

    const reply = data.choices && data.choices.length > 0 
      ? data.choices[0].message.content 
      : "No intel received from HQ."

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("Oracle Error:", errorMessage) // Logs to Supabase Dashboard
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
