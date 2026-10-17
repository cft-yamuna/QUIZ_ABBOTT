import { createGame } from './game.js';

// Compare-and-swap is enforced in Postgres, including result insertion.
// No game state or authoritative timer lives in a Function instance.
export async function processGame(store, command = {}, engineOptions = {}) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const saved = await store.load();
    const game = createGame(saved.state, engineOptions);
    game.settle();
    let result = { ok: true };
    if (command.action) {
      if (command.revision !== saved.revision || game.changed) {
        result = { ok: false, message: 'The game has changed. Please try again.' };
      } else if (command.action === 'get_operator_answer') {
        result = game.answer(command.payload);
      } else {
        result = game.action(command.action, command.payload || {});
      }
    }
    if (game.changed && !(await store.commit(saved.revision, game.state))) continue;
    return { ...result, state: game.publicState() };
  }
  throw new Error('The quiz is busy. Please try again.');
}
