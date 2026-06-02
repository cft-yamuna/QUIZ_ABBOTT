import { questions, quizConfig } from '../data/questions.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const QUIZ_QUESTION_COUNT = quizConfig.questionCount;

let currentParticipant = null;
let preparedParticipantId = null;
let activeFinalizeParticipantId = null;
let activeFinalizePromise = null;

function createEntryId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createParticipantId() {
  return `USER${String(Date.now()).slice(-6)}${Math.random().toString(16).slice(2, 4).toUpperCase()}`;
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createQuestionOrder() {
  return shuffleItems(questions.map((question) => question.id)).slice(0, QUIZ_QUESTION_COUNT);
}

async function requestJSON(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Unable to reach the quiz backend.');
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Unable to reach the quiz backend.');
  }

  return payload;
}

function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime();
  });
}

export async function getLeaderboard() {
  return requestJSON('/api/results');
}

export async function getSortedLeaderboard() {
  return sortLeaderboard(await getLeaderboard());
}

export function getCurrentParticipant() {
  return currentParticipant;
}

export function saveCurrentParticipant(participant) {
  currentParticipant = participant;
}

export function clearCurrentParticipant() {
  currentParticipant = null;
}

export function getNextParticipantId() {
  if (!preparedParticipantId) {
    preparedParticipantId = createParticipantId();
  }

  return preparedParticipantId;
}

export function createParticipant({ fullName, email }) {
  const participant = {
    id: getNextParticipantId(),
    fullName: fullName.trim(),
    email: email.trim(),
    questionOrder: createQuestionOrder(),
    answers: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
    leaderboardEntryId: null,
  };

  preparedParticipantId = null;
  saveCurrentParticipant(participant);
  return participant;
}

export function updateParticipantAnswer(questionId, optionId) {
  const participant = getCurrentParticipant();
  if (!participant) return null;

  const updated = {
    ...participant,
    answers: {
      ...participant.answers,
      [questionId]: optionId,
    },
  };

  saveCurrentParticipant(updated);
  return updated;
}

export function calculateScore(answers, quizQuestions = questions) {
  return quizQuestions.reduce((score, question) => {
    return answers?.[question.id] === question.correctOptionId ? score + 1 : score;
  }, 0);
}

export function getParticipantQuestions(participant, quizQuestions = questions) {
  const questionsById = new Map(quizQuestions.map((question) => [question.id, question]));
  const orderedIds = Array.isArray(participant?.questionOrder) ? participant.questionOrder : [];
  const orderedQuestions = orderedIds.map((questionId) => questionsById.get(questionId)).filter(Boolean);

  if (orderedQuestions.length > 0) {
    return orderedQuestions.slice(0, QUIZ_QUESTION_COUNT);
  }

  return quizQuestions.slice(0, QUIZ_QUESTION_COUNT);
}

export async function finalizeCurrentParticipant(quizQuestions = questions) {
  const participant = getCurrentParticipant();
  if (!participant) return null;

  if (participant.leaderboardEntry) {
    return participant.leaderboardEntry;
  }

  if (activeFinalizeParticipantId === participant.id && activeFinalizePromise) {
    return activeFinalizePromise;
  }

  activeFinalizeParticipantId = participant.id;
  activeFinalizePromise = (async () => {
    const score = calculateScore(participant.answers, quizQuestions);
    const total = quizQuestions.length;
    const savedResult = await requestJSON('/api/results', {
      method: 'POST',
      body: JSON.stringify({
        name: participant.fullName,
        email: participant.email,
        score,
      }),
    });
    const savedScore = Number(savedResult.score ?? score);
    const completedAt = savedResult.completedAt || new Date().toISOString();
    const entry = {
      entryId: savedResult.entryId || createEntryId(),
      name: savedResult.name || participant.fullName,
      email: savedResult.email || participant.email,
      score: savedScore,
      total,
      percentage: Math.round((savedScore / total) * 100),
      completedAt,
    };

    const latestParticipant = getCurrentParticipant();

    if (latestParticipant?.id === participant.id) {
      saveCurrentParticipant({
        ...latestParticipant,
        completedAt,
        leaderboardEntryId: entry.entryId,
        leaderboardEntry: entry,
      });
    }

    return entry;
  })();

  try {
    return await activeFinalizePromise;
  } finally {
    activeFinalizePromise = null;
    activeFinalizeParticipantId = null;
  }
}
