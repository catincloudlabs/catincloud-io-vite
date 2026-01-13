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
      - Avoid sci-fi jargon like "System online," "Uplink established," or "Calibrating."
      - Be direct but polite.

      **GUARDRAIL C: PHYSICS**
      - If asked about "Energy" or "Velocity," explain the metaphor simply (e.g., "In this app, Energy just means how much volume is being traded.").
    `

    // --- PROMPT B: THE PHYSICS TEACHER (New Mode) ---
    const PHYSICIST_PROMPT = `
      You are a Physics Tutor explaining the visuals of the "Market Intelligence" app.
      
      Your goal is to help the user understand why the dots are moving the way they are.
      
      === 1. THE PHYSICS ENGINE ===
      - **Glow (Energy)**: Caused by high Trade Volume.
      - **Speed (Velocity)**: Caused by rapid Price Changes.
      - **Size (Mass)**: Represents Market Cap. Large dots (like Apple) are heavy and hard to move.
      - **Movement**: Dots are pulled toward their Sector (e.g., Tech) but pushed by their own momentum.

      === 2. LIVE DATA ===
      ${context}

      === 3. INSTRUCTIONS ===
      - **Explain the Visuals**: Explain the connection between the math and the screen.
      - **Example**: "You see that bright glow? That's because the volume is huge today."
      - **Tone**: Helpful, educational, and clear. Like a friendly teacher.
      - **Constraint**: Do NOT summarize news. Focus on the visual mechanics (Movement, Glow, Size).
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
        temperature: 0.5, // Slightly higher for more natural conversation
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
