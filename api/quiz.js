import { createStore } from '../backend/supabase.js';
import { processGame } from '../backend/service.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  try {
    const store = createStore();
    if (req.method === 'GET') {
      if (req.query?.resource === 'results') return res.status(200).json(await store.results());
      return res.status(200).json(await processGame(store));
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, message: 'Method not allowed.' });
    }
    // Preserve the existing kiosk model: /operator controls the shared event.
    // Display clients never send this header or receive the private answer.
    // This is a role declaration, not a secret; protect the deployment for private events.
    if (req.headers['x-quiz-operator'] !== 'true') {
      return res.status(403).json({ ok: false, message: 'Operator controls are required.' });
    }
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) {
      return res.status(403).json({ ok: false, message: 'Cross-site actions are not allowed.' });
    }
    if (!req.headers['content-type']?.startsWith('application/json')) {
      return res.status(415).json({ ok: false, message: 'JSON is required.' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.action !== 'string' || !Number.isSafeInteger(body.revision)
      || JSON.stringify(body).length > 4096) {
      return res.status(400).json({ ok: false, message: 'Invalid game action.' });
    }
    const result = await processGame(store, body);
    return res.status(result.ok ? 200 : 409).json(result);
  } catch (error) {
    console.error('Quiz API failed', { name: error.name });
    return res.status(503).json({ ok: false, message: 'Unable to connect to quiz storage. Please retry shortly.' });
  }
}
