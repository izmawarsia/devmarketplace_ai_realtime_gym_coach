// Apna AI Coach — coaching API.
// Routes:
//   POST /api/coach  { exercise, issues, event, stats } -> { message }
//       Phrasing comes from Groq (Llama 3.3) when GROQ_API_KEY is set.
//       The LLM NEVER judges form — it only words the deterministic events.
//   GET  /api/tts?text=... -> audio/mpeg
//       Speech via the same Google Translate TTS endpoint gTTS wraps.
import express from 'express';
import { coachRouter } from './coach.js';
import { ttsRouter } from './tts.js';
import { historyRouter } from './history.js';

const app = express();
app.use(express.json());

app.use('/api/coach', coachRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/history', historyRouter);
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, groq: Boolean(process.env.GROQ_API_KEY) })
);

const port = process.env.API_PORT || 3001;
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
