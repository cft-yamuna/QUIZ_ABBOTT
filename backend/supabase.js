export function createStore(env = process.env, fetcher = fetch) {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  // Preview deployments must never control the production event.
  const room = env.QUIZ_ROOM || (env.VERCEL_ENV === 'preview'
    ? `preview:${env.VERCEL_GIT_COMMIT_REF || env.VERCEL_URL}` : 'production');
  async function request(path, options = {}) {
    if (!url || !key) throw new Error('Quiz database configuration is missing.');
    const response = await fetcher(`${url}/rest/v1/${path}`, {
      ...options,
      signal: AbortSignal.timeout(8000),
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      // Never log a request, its credential, or player records.
      console.error('Quiz database request failed', { status: response.status, path: path.split('?')[0] });
      throw new Error('The quiz database is unavailable. Please try again.');
    }
    return response.json();
  }
  return {
    async load() {
      const rows = await request(`umc_live_state?id=eq.${encodeURIComponent(room)}&select=revision,state`);
      return rows[0] || { revision: 0, state: null };
    },
    async commit(revision, state) {
      return request('rpc/umc_commit_state', {
        method: 'POST', body: JSON.stringify({ p_room: room, p_revision: revision, p_state: state }),
      });
    },
    async results() {
      const rows = await request('ABBOTT_QUIZ?select=id,name,score,created_at&order=score.desc,created_at.asc,id.asc&limit=100');
      return rows.map(row => ({ entryId: String(row.id), name: row.name, score: Number(row.score), completedAt: row.created_at }));
    },
  };
}
