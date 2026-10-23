import { Router } from 'express';

// Groq LLM coaching route — keeps GROQ_API_KEY server-side.
// Model: Llama 3.3 70B (llama-3.3-70b-versatile) via Groq's OpenAI-compatible API.

export const coachRouter = Router();

const SYSTEM_PROMPT =
  'You are an elite gym coach. Output 1 action-oriented command under 8 words based on form issues.';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const UPSTREAM_TIMEOUT_MS = 4000;

coachRouter.post('/', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured on the server' });
  }

  const { exercise, issues } = req.body || {};
  if (!Array.isArray(issues) || issues.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty issues array' });
  }

  const userPrompt = `Exercise: ${exercise || 'unknown'}.\nForm issues detected: ${issues
    .slice(0, 3)
    .join('; ')}.\nGive the single most important correction now.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 24,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('[coach] groq error', upstream.status, detail.slice(0, 200));
      return res.status(502).json({ error: 'groq_upstream_error' });
    }

    const data = await upstream.json();
    const cue = String(data?.choices?.[0]?.message?.content || '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .split('\n')[0]
      .trim();

    if (!cue) return res.status(502).json({ error: 'groq_empty_response' });
    return res.json({ cue, source: 'groq' });
  } catch (err) {
    console.error('[coach] request failed:', err?.message || err);
    return res.status(502).json({ error: 'groq_request_failed' });
  }
});
