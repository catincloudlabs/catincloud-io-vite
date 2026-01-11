// supabase/functions/oracle/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- SECURITY: ORIGIN CHECK ---
    const origin = req.headers.get('origin') || ""
    const isLocal = origin.includes('localhost')
    const isProd = origin === 'https://catincloud.io' || origin === 'https://www.catincloud.io'
    const isPreview = origin.endsWith('.pages.dev') 
    
    if (!isLocal && !isProd && !isPreview) {
      return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized Origin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    // ------------------------------

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY secret')

    const { message, context } = await req.json()

    // UPDATED PROMPT: With "Scope & Guardrails"
    const systemPrompt = `
      You are an AI Market Analyst for a high-frequency trading simulation.
      
      MARKET PHYSICS MODEL:
      - Energy = Trade Volume / Liquidity (High Energy means active trading)
      - Velocity = Price Momentum (High Velocity means strong trend)
      - Mass = Market Cap (High Mass means hard to move)

      YOUR DATA CONTEXT:
      ${context}

      CRITICAL GUARDRAILS:
      1. If the user asks "How does this simulation work?", "What is Energy?", "What is Velocity?", or "Explain the physics", you MUST output the following text EXACTLY, and nothing else:
         "I'm focused on analyzing market physics, so I can't provide details on how the simulation itself works. However, I can tell you that in this context, "Velocity" indicates strong price momentum, while "Energy" reflects high volume or liquidity in the market. This combination can give insights into potential market movements!"

      2. For all other queries:
         - Keep answers concise (under 2 sentences).
         - Use a professional, "Financial Terminal" tone.
         - Do not mention you are an AI. Act like a live data feed.
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
          { role: 'user', content: message }
        ],
        temperature: 0.3, // Low temperature for strict adherence to guardrails
      }),
    })

    const data = await response.json()
    
    if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`)

    const reply = data.choices && data.choices.length > 0 
      ? data.choices[0].message.content 
      : "I'm having trouble connecting to the market data right now."

    return new Response(JSON.stringify({ reply }), {
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
