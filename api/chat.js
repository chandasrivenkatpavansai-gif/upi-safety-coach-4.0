// Vercel serverless endpoint for optional ChatGPT-powered help.
// Configure OPENAI_API_KEY in Vercel Project Settings > Environment Variables.
const languageNames = { en: 'English', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam' };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const data = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const message = String(data.message || '').trim().slice(0, 500);
  const language = languageNames[data.language] || 'English';

  if (!message) return res.status(400).json({ error: 'Message is required.' });
  const digits = message.replace(/\D/g, '');
  if (/\b(pin|otp|password|cvv|account number|card number)\s*(is|:)?\s*\w+/i.test(message) ||
      /^\d{4,8}$/.test(message) || (digits.length >= 12 && digits.length <= 19)) {
    return res.status(200).json({
      reply: 'Please do not share PINs, OTPs, passwords, card numbers or bank account details. Describe only the general situation.'
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured. The built-in safety checker still works.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        store: false,
        messages: [
          {
            role: 'system',
            content: `You are UPI Safety Coach, an educational digital-payment safety assistant for users in India. Respond in ${language}. Use clear, age-appropriate language. Explain warning signs and safe next steps. Never ask for or repeat PINs, OTPs, passwords, card numbers, CVVs, bank account numbers, or remote access. Do not claim you can inspect transactions or file reports. If money was lost, advise contacting the bank/payment app immediately, calling India's 1930 cyber-fraud helpline, and reporting at https://cybercrime.gov.in/. If uncertain, say so and recommend checking through official channels. Be concise and non-alarmist.`
          },
          { role: 'user', content: message }
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, result.error?.type || 'unknown');
      return res.status(502).json({ error: 'AI service request failed. Check the API key, billing and model access.' });
    }
    const reply = result.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: 'AI returned an empty response.' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI request failed:', error.message);
    return res.status(502).json({ error: 'Could not reach the AI service. Please try again.' });
  }
}

