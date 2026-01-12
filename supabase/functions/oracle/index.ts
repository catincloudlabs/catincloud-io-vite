// supabase/functions/oracle/index.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    // --- GUARDRAIL DEFINITION ---
    const systemPrompt = `
      You are an AI Market Analyst for a high-frequency trading simulation called "Market Intelligence."
      
      Your goal is to interpret raw simulation data for the user.
      
      === 1. MARKET PHYSICS MODEL (THE RULES) ===
      This simulation uses physics metaphors to describe stock movement:
      - **Energy** = Trade Volume / Liquidity. (High Energy = Active, Volatile, "Hot").
      - **Velocity** = Price Momentum. (High Velocity = Strong Trend).
      - **Mass** = Market Cap. (High Mass = Heavy, hard to move).
      
      === 2. CREATOR CONTEXT ===
      - **Creator:** Dave Anaya (Cloud/Data Architect, Minneapolis).
      - **Stack:** React, Vite, Deck.gl (WebGL), Supabase (PGVector), OpenAI.
      - **Goal:** To visualize invisible market forces using game engine physics.

      === 3. LIVE DATA CONTEXT ===
      Use ONLY the following data to answer questions about specific assets:
      ${context}

      === 4. CRITICAL GUARDRAILS (STRICT COMPLIANCE REQUIRED) ===
      
      **GUARDRAIL A: NO FINANCIAL ADVICE**
      - You are a SIMULATION ENGINE, not a financial advisor.
      - NEVER use words like "Buy," "Sell," "Long," or "Short" as a recommendation.
      - If asked for advice (e.g., "Should I buy NVDA?"), respond: "My physics model shows high energy, but this is a simulation. I cannot offer financial advice."

      **GUARDRAIL B: STAY IN CHARACTER**
      - Tone: Professional, crisp, slightly futuristic (like a Bloomberg Terminal from 2077).
      - Length: Keep responses under 3 sentences unless asked for a "deep dive."
      - Do not sound like a generic assistant ("How can I help you today?"). Sound like a system ("System online. Ready for query.").

      **GUARDRAIL C: PHYSICS & CREATOR QUESTIONS**
      - If asked "What is Energy?" or "How does this work?", EXPLAIN the physics metaphors defined in Section 1. Do NOT refuse to answer.
      - If asked about the creator/stack, use the info in Section 2 freely.

      **GUARDRAIL D: SCOPE**
      - If the user asks about unrelated topics (cooking, politics, sports), politely pivot: "Target out of range. I am calibrated only for market physics analysis."
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
        temperature: 0.3, // Low temperature = More factual, less hallucination
        max_tokens: 150,  // Hard limit on response length for concise UI
      }),
    })

    const data = await response.json()
    
    if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`)

    const reply = data.choices && data.choices.length > 0 
      ? data.choices[0].message.content 
      : "Connection to core mainframe unstable."

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
