import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || body.content || '';

    if (!userMessage.trim()) {
      return NextResponse.json({ reply: 'Please enter a message.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: '⚠️ Error: GEMINI_API_KEY is not defined in .env.local' }, { status: 200 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: {
          parts: [{ text: 'You are APEX, an expert Formula 1 AI trackside engineer. Must use real-time 2026 F1 information. Restrict responses to short, direct answers with bullet points. Exclude unnecessary filler and lengthy background explanations.' }]
        },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 350
        },
        tools: [{ google_search: {} }]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || 'Gemini API call failed';
      return NextResponse.json({ reply: `⚠️ API Error: ${errMsg}` }, { status: 200 });
    }

    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response returned from model.';
    return NextResponse.json({ reply: replyText }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ reply: `⚠️ Server Route Error: ${error.message || 'Unknown failure'}` }, { status: 200 });
  }
}
