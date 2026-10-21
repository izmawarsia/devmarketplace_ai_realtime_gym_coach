// Text-to-speech route, gTTS-equivalent: streams MP3 from the same Google
// Translate TTS endpoint the Python gTTS package wraps. If upstream fails the
// client falls back to the browser's built-in speechSynthesis.
import { Router } from 'express';

export const ttsRouter = Router();

ttsRouter.get('/', async (req, res) => {
  const text = String(req.query.text || '').slice(0, 300);
  if (!text) return res.status(400).json({ error: 'text required' });

  try {
    const url =
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en' +
      `&q=${encodeURIComponent(text)}`;
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!upstream.ok) throw new Error(`TTS ${upstream.status}`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    const { Readable } = await import('node:stream');
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.warn('[tts] failed:', err.message);
    res.status(502).json({ error: 'tts unavailable' });
  }
});
