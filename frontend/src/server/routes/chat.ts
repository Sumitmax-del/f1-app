import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.prompt || req.body.content || '';

    if (!userMessage.trim()) {
      return res.status(400).json({ reply: 'Please enter a message.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ reply: '⚠️ Error: GEMINI_API_KEY is not defined in .env.local' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const fetchRes = await fetch(geminiUrl, {
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

    const data = await fetchRes.json();

    if (!fetchRes.ok) {
      const errMsg = data?.error?.message || 'Gemini API call failed';
      return res.json({ reply: `⚠️ API Error: ${errMsg}` });
    }

    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response returned from model.';
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.json({ reply: `⚠️ Server Route Error: ${error.message || 'Unknown failure'}` });
  }
});

export default router;
