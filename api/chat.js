const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are Vita, a professional customer support agent for a top real estate agency. You are warm, polished, and efficient.

YOUR RESPONSIBILITIES:
- Help clients buy, sell, or rent properties
- Answer all real estate questions knowledgeably
- Collect lead information professionally

CONVERSATION RULES:
- Keep responses concise and professional — 2 to 3 sentences
- Acknowledge what the client says before responding
- Never sound robotic or scripted
- When a client says "ok", "thanks", "yes", "perfect", "great", or "bye":
  Respond warmly: "Wonderful! I've noted everything down. Our agent will reach out to you within 2 hours. Is there anything else I can help with?"
- If they say "no" or "that's all": "You're all set then! Thanks for your time, and expect a call within 2 hours. Have a great day!"

LEAD DETAILS TO COLLECT (one at a time, naturally):
1. Full Name
2. Phone Number
3. Buy, Sell, or Rent
4. Budget or Property Value
5. Location
6. Timeline

CRITICAL — WHEN ALL 6 DETAILS ARE COLLECTED:
You MUST output this exact line at the end of your message:
LEAD_CAPTURED:{"name":"Paul","phone":"555-1234","budget":"$800k","type":"sell","location":"Ohio","timeline":"3 weeks"}

Make sure to use the actual values from the conversation. This triggers the lead saving system.`
          },
          ...messages
        ],
        max_tokens: 400,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vita-bot.vercel.app',
          'X-Title': 'Vita Real Estate Bot'
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;

    let leadData = null;
    const leadMatch = aiMessage.match(/LEAD_CAPTURED:(\{[^}]+\})/);
    if (leadMatch) {
      try {
        leadData = JSON.parse(leadMatch[1]);
      } catch (e) {
        leadData = null;
      }
    }

    const cleanMessage = aiMessage.replace(/LEAD_CAPTURED:\{[^}]+\}/, '').trim();

    res.status(200).json({
      message: cleanMessage,
      leadData: leadData
    });

  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({
      message: "I'm having a small technical issue. Please try again in a moment."
    });
  }
};