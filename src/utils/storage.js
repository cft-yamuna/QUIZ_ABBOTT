import { calculateScore, getTalentTag } from '../data/questions.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_TABLE = import.meta.env.VITE_SUPABASE_TABLE || 'ABBOTT_QUIZ';

// One player at a time on the kiosk, so the session lives in memory and a
// reload starts the flow over.
let currentParticipant = null;
const savesByParticipantId = new Map();

function createParticipantId() {
  return `USER${String(Date.now()).slice(-6)}${Math.random().toString(16).slice(2, 4).toUpperCase()}`;
}

async function readJSON(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.hint || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function insertIntoSupabase(row) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  return readJSON(response, 'Unable to reach Supabase.');
}

// Columns added after the table was first made. Until each one exists in
// Supabase, rows are saved without it rather than the whole lead being lost.
const OPTIONAL_COLUMNS = ['phone', 'tag'];

// Postgres and PostgREST both name the column when it doesn't exist.
function findMissingColumn(error, row) {
  if (error.status !== 400) return null;
  return OPTIONAL_COLUMNS.find((column) => column in row && new RegExp(`\\b${column}\\b`, 'i').test(error.message));
}

async function insertWithoutMissingColumns(row) {
  try {
    return await insertIntoSupabase(row);
  } catch (error) {
    const column = findMissingColumn(error, row);
    if (!column) throw error;

    console.warn(`Supabase table has no ${column} column; saved this result without it.`);
    const { [column]: _dropped, ...rest } = row;
    return insertWithoutMissingColumns(rest);
  }
}

async function postResult(result) {
  if (hasSupabaseConfig()) {
    return insertWithoutMissingColumns(result);
  }

  const response = await fetch(`${API_BASE_URL}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  return readJSON(response, 'Unable to reach the quiz backend.');
}

export function getCurrentParticipant() {
  return currentParticipant;
}

export function startParticipant({ name, email = '', phone = '' }) {
  currentParticipant = {
    id: createParticipantId(),
    fullName: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    answers: {},
    startedAt: new Date().toISOString(),
  };

  return currentParticipant;
}

export function recordAnswer(questionId, optionId) {
  if (!currentParticipant) return;

  currentParticipant = {
    ...currentParticipant,
    answers: { ...currentParticipant.answers, [questionId]: optionId },
  };
}

export function clearCurrentParticipant() {
  currentParticipant = null;
}

/*
 * Saves the finished run once per participant. It's best effort: the result
 * screens work from local state, so a failed save is logged and never
 * blocks the player.
 */
export function saveResult(participant) {
  if (!participant) return Promise.resolve();

  if (!savesByParticipantId.has(participant.id)) {
    const save = postResult({
      name: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      score: calculateScore(participant.answers),
      tag: getTalentTag(participant.answers).title,
    }).catch((error) => {
      console.warn('Quiz result was not saved:', error.message);
    });

    savesByParticipantId.set(participant.id, save);
  }

  return savesByParticipantId.get(participant.id);
}
