// Small Socket.IO-compatible adapter for the stateless Vercel API.
// Serialize requests so an older poll can never overwrite a newer action.
export function createCloudQuizTransport({ operator, fetcher = fetch, pollMs = 500 }) {
  const listeners = new Map();
  let stopped = false;
  let timer;
  let state;
  let queue = Promise.resolve();
  const dispatch = (event, value) => listeners.get(event)?.forEach(fn => fn(value));
  const socket = {
    connected: false,
    on(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
      return socket;
    },
    timeout() { return socket; },
    emit(event, payload, callback) {
      if (stopped || event === 'request_state') return;
      queue = queue.then(async () => {
        if (stopped) return;
        try {
          const result = await request({ action: event, payload, revision: state?.revision ?? 0 });
          callback?.(null, result);
        } catch (error) {
          callback?.(error);
        }
      });
    },
    disconnect() {
      stopped = true;
      clearTimeout(timer);
      socket.connected = false;
      listeners.clear();
    },
  };
  async function request(command) {
    try {
      const response = await fetcher('/api/quiz', {
        method: command ? 'POST' : 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
        ...(command ? {
          headers: { 'Content-Type': 'application/json', 'X-Quiz-Operator': String(operator) },
          body: JSON.stringify(command),
        } : {}),
      });
      const result = await response.json();
      if ((!response.ok && response.status !== 409) || !result.state) {
        throw new Error(result.message || 'Quiz server unavailable.');
      }
      if (stopped) return result;
      state = result.state;
      if (!socket.connected) {
        socket.connected = true;
        dispatch('connect');
        dispatch('operator_access', { authorized: operator });
      }
      dispatch('quiz_state', state);
      return result;
    } catch (error) {
      if (!stopped) {
        socket.connected = false;
        dispatch('disconnect');
        dispatch('connect_error', error);
      }
      throw error;
    }
  }
  function poll() {
    if (stopped) return;
    queue = queue.then(() => stopped ? null : request()).catch(() => {}).finally(() => {
      if (!stopped) timer = setTimeout(poll, socket.connected ? pollMs : 2000);
    });
  }
  // Let the hook attach its listeners before the first request completes.
  timer = setTimeout(poll, 0);
  return socket;
}
