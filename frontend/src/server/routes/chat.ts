import express from 'express';

const router = express.Router();

/**
 * POST /api/chat
 * Proxies chat requests directly to the Python F1 AI Agent on port 8000.
 */
router.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.chatInput || req.body.prompt || req.body.question || '';
    const context = req.body.context || null;
    const agentBaseUrl = process.env.AI_AGENT_URL || 'http://localhost:8000';
    const targetUrl = `${agentBaseUrl.replace(/\/$/, '')}/api/chat`;

    if (!userMessage.trim()) {
      return res.status(400).json({
        reply: 'Please enter a message.',
        response: 'Please enter a message.',
        text: 'Please enter a message.',
        output: 'Please enter a message.',
      });
    }

    const agentResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        context: context,
      }),
    });

    const data = await agentResponse.json();
    const finalAnswer = data.reply || data.response || data.answer || data.text || data.output || 'No response returned.';

    return res.json({
      reply: finalAnswer,
      response: finalAnswer,
      text: finalAnswer,
      output: finalAnswer,
      tool_used: data.tool_used || null,
      sources: data.sources || [],
      model: data.model || 'HuggingFace',
    });
  } catch (error: any) {
    console.error('[AI AGENT CHAT ERROR]:', error);
    return res.status(500).json({
      reply: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      response: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      text: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
      output: `[!] Connection to F1 AI Agent failed. Ensure the Python agent is running on port 8000. (${error.message})`,
    });
  }
});

export default router;
