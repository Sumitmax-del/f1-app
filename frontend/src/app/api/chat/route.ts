import { NextResponse } from 'next/server';

/**
 * POST /api/chat
 * Next.js App Router route for routing chat requests to the Python F1 AI Agent.
 * The agent synthesizes clean answers via Gemini — raw search data is never exposed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.chatInput || body.prompt || body.question || '';
    const context = body.context || null;

    if (!message.trim()) {
      return NextResponse.json({
        reply: 'Please enter a message.',
        response: 'Please enter a message.',
        text: 'Please enter a message.',
        output: 'Please enter a message.',
      }, { status: 400 });
    }

    const agentBaseUrl = process.env.AI_AGENT_URL || 'http://localhost:8000';
    const targetUrl = `${agentBaseUrl.replace(/\/$/, '')}/api/chat`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: context,
      }),
    });

    const data = await res.json();
    const reply = data.reply || data.response || data.answer || data.text || data.output || 'No response received.';

    return NextResponse.json({
      reply: reply,
      response: reply,
      text: reply,
      output: reply,
      tool_used: data.tool_used || null,
      sources: data.sources || [],
      model: data.model || 'Gemini',
      debug: data.debug || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      reply: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      response: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      text: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      output: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
    }, { status: 500 });
  }
}
