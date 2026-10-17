import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../backend/game.js';
import { processGame } from '../backend/service.js';
import { createStore } from '../backend/supabase.js';
import handler from '../api/quiz.js';

function memoryStore() {
  let saved = { revision: 0, state: null };
  const results = new Map();
  return {
    results,
    async load() { return structuredClone(saved); },
    async commit(revision, state) {
      if (saved.revision !== revision) return false;
      saved = { revision: state.revision, state: structuredClone(state) };
      if (state.status === 'finished') results.set(state.runId, state.score);
      return true;
    },
  };
}

test('cloud engine preserves pause, deadlines, hidden answers, feedback and all eight outcomes', async () => {
  for (let correctCount = 0; correctCount <= 8; correctCount += 1) {
    const store = memoryStore();
    let now = 100000;
    let result = await processGame(store, {}, { now });
    async function action(action, payload) {
      result = await processGame(store, { action, payload, revision: result.state.revision }, { now });
      assert.equal(result.ok, true, `${action}: ${result.message}`);
    }
    await action('start');
    assert.equal(result.state.questions.length, 8);
    assert.ok(result.state.questions.every(q => !q.correctOptionId && !q.correctOptionIds));
    await action('name_update', { name: 'Cloud test' });
    await action('name_submit');
    for (let level = 1; level <= 8; level += 1) {
      const question = (await store.load()).state.questions[level - 1];
      now += 5000;
      await action('select_option', { optionId: level <= correctCount ? question.correctOptionId : question.options.find(o => o.id !== question.correctOptionId).id });
      const remaining = result.state.questionRemainingMs;
      now += 100000;
      result = await processGame(store, {}, { now });
      assert.equal(result.state.phase, 'confirming');
      assert.equal(result.state.questionRemainingMs, remaining);
      await action('answer_back');
      assert.equal(result.state.questionDeadline, now + remaining);
      await action('select_option', { optionId: level <= correctCount ? question.correctOptionId : question.options.find(o => o.id !== question.correctOptionId).id });
      await action('lock_answer');
      assert.equal(result.state.phase, 'locked');
      assert.deepEqual(result.state.questions[level - 1].correctOptionIds, [question.correctOptionId]);
      assert.equal(result.state.questions[level - 1].explanation, undefined);
      now += 3999;
      result = await processGame(store, {}, { now });
      assert.equal(result.state.phase, 'locked');
      now += 1;
      result = await processGame(store, {}, { now });
      assert.equal(result.state.phase, 'feedback');
      now += 9999;
      result = await processGame(store, {}, { now });
      assert.equal(result.state.phase, 'feedback');
      now += 1;
      result = await processGame(store, {}, { now });
      if (level > correctCount || level === 8) break;
      assert.equal(result.state.questionIndex, level);
    }
    assert.equal(result.state.status, 'finished');
    assert.equal(result.state.score, correctCount);
    assert.equal(result.state.outcome.type, correctCount === 8 ? 'champion' : correctCount >= 4 ? 'milestone' : 'eliminated');
    assert.equal(result.state.outcome.awardedLevel, correctCount >= 4 ? correctCount : 0);
    assert.equal(store.results.size, 1);
    await processGame(store, {}, { now: now + 100000 });
    assert.equal(store.results.size, 1);
  }
});

test('cloud concurrent clicks commit once; independent instances reload the same state', async () => {
  const store = memoryStore();
  const commands = await Promise.all(Array.from({ length: 8 }, () => processGame(store, { action: 'start', revision: 0 })));
  assert.equal(commands.filter(r => r.ok).length, 1);
  assert.equal(new Set(commands.map(r => r.state.sessionId)).size, 1);
  const saved = await store.load();
  const reconnect = createGame(saved.state);
  assert.deepEqual(reconnect.state.questions, saved.state.questions);
});

test('cloud manual feedback, lifeline, private answer and unanswered timeout', async () => {
  let game = createGame(null, { now: 100 });
  game.action('start'); game.action('name_update', { name: 'Test' }); game.action('name_submit');
  const q = game.state.questions[0];
  assert.equal(game.answer({ sessionId: game.state.runId, questionId: q.id }).ok, true);
  assert.equal(game.publicState().questions[0].correctOptionIds, undefined);
  game.action('use_lifeline', { type: 'fiftyFifty' });
  assert.equal(game.state.eliminatedOptionIds.length, 2);
  assert.ok(!game.state.eliminatedOptionIds.includes(q.correctOptionId));
  game.action('select_option', { optionId: q.correctOptionId }); game.action('lock_answer');
  game = createGame(game.state, { now: 4100 }); game.settle();
  assert.equal(game.action('continue_feedback', { sessionId: game.state.runId, questionId: q.id }).ok, true);
  assert.equal(game.state.questionIndex, 1);
  game = createGame(game.state, { now: 49100 }); game.settle();
  assert.equal(game.state.status, 'finished');
  assert.equal(game.state.outcome.type, 'eliminated');
});

test('cloud storage never falls back to browser anon key', async () => {
  const store = createStore({ VITE_SUPABASE_URL: 'https://example.test', VITE_SUPABASE_ANON_KEY: 'public' }, () => assert.fail('must not fetch'));
  await assert.rejects(() => store.load(), /configuration is missing/);
});

test('cloud action rejects display and cross-site requests before database access', async () => {
  for (const headers of [{}, { 'x-quiz-operator': 'true', origin: 'https://other.test', host: 'quiz.test' }]) {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; } };
    await handler({ method: 'POST', headers }, res);
    assert.equal(res.code, 403);
  }
});
