// Local development server. Vercel uses /api/chat.js for the deployed API.
const http = require('http');
const fs = require('fs');
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (_) {}

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function handleChat(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 503, { error: 'AI is not configured. Built-in safety checks remain available.' });
  }
  let raw = '';
  try {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 12000) return sendJson(res, 413, { error: 'Request is too large.' });
    }
    const data = JSON.parse(raw || '{}');
    const message = String(data.message || '').trim().slice(0, 500);
    const languageNames = { en: 'English', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam' };
    const language = languageNames[data.language] || 'English';
    if (!message) return sendJson(res, 400, { error: 'Message is required.' });
    const digits = message.replace(/\D/g, '');
    if (/\b(pin|otp|password|cvv|account number|card number)\s*(is|:)?\s*\w+/i.test(message) ||
        /^\d{4,8}$/.test(message) || (digits.length >= 12 && digits.length <= 19)) {
      return sendJson(res, 200, { reply: 'Please do not share PINs, OTPs, passwords, card numbers or bank account details. Describe only the general situation.' });
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return sendJson(res, 502, { error: 'AI service request failed. Check the server API key, billing and model access.' });
    const reply = result.choices?.[0]?.message?.content;
    if (!reply) return sendJson(res, 502, { error: 'AI returned an empty response.' });
    return sendJson(res, 200, { reply });
  } catch (error) {
    return sendJson(res, 400, { error: 'Unable to process this request.' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/api/chat') return handleChat(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD, POST' });
    return res.end('Method not allowed');
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.resolve(ROOT, '.' + pathname);
  if (!filePath.startsWith(ROOT + path.sep) || ['.env', 'server.js', 'package.json'].includes(path.basename(filePath))) {
    res.writeHead(404);
    return res.end('Not found');
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.listen(PORT, () => console.log(`UPI Safety Coach running at http://localhost:${PORT}`));
