import express from 'express';
import { coachRouter } from './coach.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, groqConfigured: Boolean(process.env.GROQ_API_KEY) });
});

app.use('/api/coach', coachRouter);

const port = Number(process.env.API_PORT) || 3001;
app.listen(port, () => {
  console.log(`[api] coaching API listening on http://localhost:${port}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('[api] GROQ_API_KEY is not set — /api/coach will return 503 and the client will use fallback cues.');
  }
});
