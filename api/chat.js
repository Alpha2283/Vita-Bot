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
            content: `You are Zetro, a seasoned real estate expert with 15+ years of experience helping clients buy, sell, and rent properties. You work for a top-tier real estate agency.

YOUR PERSONALITY:
- Warm, knowledgeable, and genuinely helpful
- Confident and direct — never say "I am programmed" or "as an AI"
- Use natural phrases: "I'd love to help with that" or "Great question!"
- Keep responses short — 2 to 3 sentences maximum

WHAT YOU HANDLE:
- Answer ALL real estate questions — buying, selling, renting, market trends, pricing, neighborhoods
- If someone wants to sell, enthusiastically help them and mention you can connect them with a listing agent
- You know about mortgages, inspections, closing costs, property taxes, market conditions

LEAD COLLECTION (do this naturally in conversation, ONE question at a time):
1. Full Name
2. Phone Number  
3. Are they looking to Buy, Rent, or Sell
4. Budget Range (if buying) or Property Value (if selling)
5. Preferred Location or Area
6. Timeline

LEAD CAPTURE FORMAT:
When all 6 details are collected, confirm them back warmly and say the right agent will reach out within 2 hours. Then add:
LEAD_CAPTURED:{"name":"Full Name","phone":"555-1234","budget":"$400k","type":"sell","location":"Houston TX","timeline":"2 months"}`
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