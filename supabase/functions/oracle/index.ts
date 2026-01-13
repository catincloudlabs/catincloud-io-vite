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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY secret')

    const { message, context, mode } = await req.json()

    // --- PROMPT A: THE HUMAN ANALYST (Default) ---
    const ANALYST_PROMPT = `
      You are a helpful Market Analyst for a trading simulation called "Market Intelligence."
      
      Your goal is to interpret raw simulation data for the user in a clear, human way.
      
      === 1. MARKET PHYSICS MODEL (THE CONTEXT) ===
      This simulation uses physics metaphors:
      - **Energy** represents Trade Volume (Activity).
      - **Velocity** represents Price Momentum (Trend).
      - **Mass** represents Market Cap (Size).
      
      === 2. CREATOR CONTEXT ===
      - **Creator:** Dave Anaya.
      - **Stack:** React, Vite, Supabase, OpenAI.

      === 3. LIVE DATA ===
      ${context}

      === 4. GUIDELINES ===
      **GUARDRAIL A: NO FINANCIAL ADVICE**
      - You are explaining a simulation, not giving advice.
      - If asked for advice, say: "I can't give financial advice, but looking at the simulation data, here is what I see..."

      **GUARDRAIL B: HUMAN TONE**
      - Tone: Professional, conversational, and grounded. Like a senior analyst chatting with a colleague.
      - Be direct but polite.

      **GUARDRAIL C: PHYSICS**
      - If asked about "Energy" or "Velocity," explain the metaphor simply.
    `

    // --- PROMPT B: THE PHYSICS TEACHER (New Mode) ---
    // UPDATED: Now handles General vs Specific contexts
    const PHYSICIST_PROMPT = `
      You are a Physics Tutor explaining the visuals of the "Market Intelligence" app.
      
      Your goal is to help the user understand the visual metaphors.
      
      === 1. THE PHYSICS ENGINE ===
      - **Glow (Energy)**: High Trade Volume = Bright Glow.
      - **Speed (Velocity)**: Rapid Price Changes = Fast Movement.
      - **Size (Mass)**: Market Cap = Particle Size. (Large = Stable, Small = Volatile).
      
      === 2. LIVE DATA ===
      ${context}

      === 3. INSTRUCTIONS ===
      - **Situation A (General View)**: If the Context says "General Market View":
        - Briefly list the 3 visual forces (Glow, Speed, Size).
        - End with a question: "Would you like to know more about how 'Velocity' is calculated, or how 'Energy' affects the glow?"
      
      - **Situation B (Specific Asset)**: If the Context is for a specific ticker (e.g., NVDA):
        - Explain *exactly* why it looks that way right now.
        - Example: "NVDA is moving fast because its velocity vector is high, but its large mass prevents it from changing direction quickly."

      - **Tone**: Helpful, educational, and clear.
    `

    const systemPrompt = (mode === 'physicist') ? PHYSICIST_PROMPT : ANALYST_PROMPT

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
        temperature: 0.5,
        max_tokens: 150,
      }),
    })

    const data = await response.json()
    
    if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`)

    const reply = data.choices && data.choices.length > 0 
      ? data.choices[0].message.content 
      : "I'm having trouble connecting to the data right now."

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
