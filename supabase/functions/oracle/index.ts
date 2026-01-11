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
      You are a helpful AI financial assistant embedded in a market visualization app.
      
      Context:
      - The user is looking at a "Physics" model of the stock market.
      - High "Velocity" means strong price momentum.
      - High "Energy" means high volume/liquidity.
      
      Your Goal: Answer the user's question as if you are ChatGPT discussing market news. 
      - Be conversational and polite.
      - Synthesize the provided data (headlines + physics) into a cohesive answer.
      - Keep it concise (2-3 sentences) but natural.

      SCOPE & GUARDRAILS:
      - You are STRICTLY a financial market assistant.
      - If the user asks about non-financial topics (e.g., recipes, coding, politics, general trivia), politely decline.
      - Refusal Strategy: Pivot back to the market. 
        - Example: "I'm focused on analyzing market physics, so I can't help with that. However, I can tell you that [Ticker] is showing strong momentum..."
      - Do NOT answer the non-financial question, even if you know the answer.
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
        temperature: 0.6, // Lowered slightly to improve instruction following
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
