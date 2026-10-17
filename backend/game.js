import crypto from 'node:crypto';
import { questions as questionBank, quizConfig } from '../src/data/questions.js';
import { selectLevelQuestions } from '../src/data/levelQuestions.js';

// Request-local game engine. Deadlines are persisted, not process timers.
export function createGame(snapshot, { now = Date.now(), questionMs = 45000, revealMs = 4000, feedbackMs = 10000, registrationMs = 60000 } = {}) {
const QUESTIONS_PER_RUN = quizConfig.questionCount;
const LIFELINE_TYPES = ['audiencePoll', 'phoneAFriend', 'fiftyFifty'];
const QUESTION_DURATION_MS = questionMs;
const FEEDBACK_REVEAL_DELAY_MS = revealMs;
const FEEDBACK_DELAY_MS = feedbackMs;
const REGISTRATION_IDLE_TIMEOUT_MS = registrationMs;
let quizState = snapshot?.status ? structuredClone(snapshot) : createIdleState();
let changed = false;
function setQuizState(nextState) {
  quizState = { ...nextState, revision: quizState.revision + 1, updatedAt: new Date(now).toISOString() };
  changed = true;
}

function correctOptionIds(question) {
  return Array.isArray(question?.correctOptionIds)
    ? question.correctOptionIds
    : [question?.correctOptionId].filter(Boolean);
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createRunQuestions() {
  return selectLevelQuestions()
    .map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));
}

function createLifelineState() {
  return {
    audiencePoll: { used: false, activatedAt: null },
    phoneAFriend: { used: false, activatedAt: null },
    fiftyFifty: { used: false, activatedAt: null },
  };
}

function createIdleState() {
  return {
    version: 1,
    revision: 0,
    runId: null,
    status: 'idle',
    phase: null,
    questionIndex: 0,
    questions: [],
    selectedOption: null,
    feedbackVisible: false,
    feedbackRevealAt: null,
    feedbackEndsAt: null,
    eliminatedOptionIds: [],
    lifelines: createLifelineState(),
    activeLifeline: null,
    answers: [],
    score: 0,
    completedLevel: 0,
    outcome: null,
    playerName: '',
    questionStartedAt: null,
    questionDeadline: null,
    questionRemainingMs: QUESTION_DURATION_MS,
    registrationExpiresAt: null,
    createdAt: null,
    updatedAt: new Date(now).toISOString(),
    completedAt: null,
    resultSavedAt: null,
    resultView: 'sequence',
  };
}

function createRegistrationState() {

  return {
    version: 1,
    revision: 0,
    runId: crypto.randomUUID(),
    status: 'registering',
    phase: null,
    questionIndex: 0,
    questions: createRunQuestions(),
    selectedOption: null,
    feedbackVisible: false,
    feedbackRevealAt: null,
    feedbackEndsAt: null,
    eliminatedOptionIds: [],
    lifelines: createLifelineState(),
    activeLifeline: null,
    answers: [],
    score: 0,
    completedLevel: 0,
    outcome: null,
    playerName: '',
    questionStartedAt: null,
    questionDeadline: null,
    questionRemainingMs: QUESTION_DURATION_MS,
    registrationExpiresAt: now + REGISTRATION_IDLE_TIMEOUT_MS,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    completedAt: null,
    resultSavedAt: null,
    resultView: 'sequence',
  };
}

function currentQuestion() {
  return quizState.questions[quizState.questionIndex];
}

function sanitizePlayerName(value) {
  if (typeof value !== 'string') return '';

  const sanitized = value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return Array.from(sanitized).slice(0, 30).join('');
}

function hasValidPlayerName(value) {
  return Array.from(value.replace(/\s/g, '')).length >= 2;
}

function createPublicQuizState() {
  const currentAnswer = quizState.answers.at(-1);
  const isWaitingForFeedback = quizState.status === 'running' && quizState.phase === 'locked';
  const publicScore = isWaitingForFeedback && currentAnswer?.isCorrect
    ? quizState.score - 1
    : quizState.score;
  const publicQuestions = quizState.questions.map((question, index) => {
    const {
      correctOptionId: _correctOptionId,
      correctOptionIds: _correctOptionIds,
      explanation: _explanation,
      ...publicQuestion
    } = question;

    if (['locked', 'feedback'].includes(quizState.phase) && index === quizState.questionIndex) {
      return {
        ...publicQuestion,
        correctOptionIds: correctOptionIds(question),
        ...(quizState.phase === 'feedback' ? {
          explanation: question.explanation || questionBank.find((entry) => entry.id === question.id)?.explanation || '',
        } : {}),
      };
    }

    return publicQuestion;
  });
  const publicAnswers = quizState.answers.map(({ isCorrect: _isCorrect, ...answer }) => answer);
  return {
    ...quizState,
    sessionId: quizState.runId,
    serverNow: now,
    runId: undefined,
    questions: publicQuestions,
    answers: publicAnswers,
    score: publicScore,
  };
}

function createOutcome({ isChampion = false, failedLevel = null } = {}) {
  if (isChampion) {
    return {
      type: 'champion',
      awardedLevel: QUESTIONS_PER_RUN,
      failedLevel: null,
    };
  }

  const awardedLevel = quizState.completedLevel >= 4 ? quizState.completedLevel : 0;
  return {
    type: awardedLevel > 0 ? 'milestone' : 'eliminated',
    awardedLevel,
    failedLevel,
  };
}

function selectOption(optionId) {
  const question = currentQuestion();

  if (quizState.status !== 'running') {
    return { ok: false, message: 'The quiz is not currently running.' };
  }

  if (quizState.phase !== 'answering') {
    return { ok: false, message: 'An answer cannot be selected in the current game phase.' };
  }

  if (expireQuestionIfDue()) return { ok: false, message: 'Time is up for this question.' };

  if (quizState.activeLifeline) {
    return { ok: false, message: 'Finish the active lifeline before selecting an answer.' };
  }

  if (
    !question?.options.some((option) => option.id === optionId)
    || quizState.eliminatedOptionIds.includes(optionId)
  ) {
    return { ok: false, message: 'That option is not valid for the current question.' };
  }

  const remainingMs = Math.max(0, quizState.questionDeadline - now);
  if (remainingMs === 0) {
    expireQuestionIfDue();
    return { ok: false, message: 'Time is up for this question.' };
  }
  setQuizState({
    ...quizState,
    questionRemainingMs: remainingMs,
    questionDeadline: null,
    selectedOption: optionId,
    phase: 'confirming',
    feedbackVisible: false,
  });

  return { ok: true };
}

function goBack() {
  if (quizState.status !== 'running' || quizState.phase !== 'confirming') {
    return { ok: false, message: 'Go Back is only available before an answer is locked.' };
  }

  setQuizState({
    ...quizState,
    selectedOption: null,
    phase: 'answering',
    questionDeadline: now + quizState.questionRemainingMs,
  });
  return { ok: true };
}

function finishRun(outcome, { timedOut = false } = {}) {
  const completedAt = new Date(now).toISOString();
  setQuizState({
    ...quizState,
    status: 'finished',
    phase: null,
    questionDeadline: null,
    questionRemainingMs: timedOut ? 0 : quizState.questionRemainingMs,
    feedbackVisible: true,
    feedbackRevealAt: null,
    feedbackEndsAt: null,
    activeLifeline: null,
    outcome,
    resultView: 'sequence',
    completedAt,
  });
}

function showLeaderboard() {
  if (quizState.status !== 'finished') {
    return { ok: false, message: 'The leaderboard is available after the quiz finishes.' };
  }

  setQuizState({
    ...quizState,
    resultView: 'leaderboard',
  });
  return { ok: true };
}

function hideLeaderboard() {
  if (quizState.status !== 'finished' || quizState.resultView !== 'leaderboard') {
    return { ok: false, message: 'Back is only available from the leaderboard.' };
  }

  setQuizState({
    ...quizState,
    resultView: 'sequence',
  });
  return { ok: true };
}

function advanceAfterFeedback(expectedRunId, expectedQuestionIndex) {
  if (
    quizState.runId !== expectedRunId
    || quizState.questionIndex !== expectedQuestionIndex
    || quizState.status !== 'running'
  ) return;

  const answer = quizState.answers.at(-1);
  const currentLevel = quizState.questionIndex + 1;

  if (!answer?.isCorrect) {
    finishRun(createOutcome({ failedLevel: currentLevel }));
    return;
  }

  if (currentLevel >= QUESTIONS_PER_RUN) {
    finishRun(createOutcome({ isChampion: true }));
    return;
  }

  setQuizState({
    ...quizState,
    questionIndex: quizState.questionIndex + 1,
    phase: 'answering',
    selectedOption: null,
    feedbackVisible: false,
    feedbackRevealAt: null,
    feedbackEndsAt: null,
    eliminatedOptionIds: [],
    activeLifeline: null,
    questionStartedAt: now,
    questionDeadline: now + QUESTION_DURATION_MS,
    questionRemainingMs: QUESTION_DURATION_MS,
  });
}

function continueFeedback(payload = {}) {
  if (
    quizState.status !== 'running'
    || quizState.phase !== 'feedback'
    || payload?.sessionId !== quizState.runId
    || payload?.questionId !== currentQuestion()?.id
  ) {
    return { ok: false, message: 'This answer feedback is no longer active.' };
  }

  advanceAfterFeedback(quizState.runId, quizState.questionIndex);
  return { ok: true };
}

function lockAnswer() {
  const question = currentQuestion();

  if (
    quizState.status !== 'running'
    || quizState.phase !== 'confirming'
    || !quizState.selectedOption
  ) {
    return { ok: false, message: 'Select an answer before locking it.' };
  }

  if (quizState.answers.some((answer) => answer.questionId === question?.id)) {
    return { ok: false, message: 'This level already has a locked answer.' };
  }

  const isCorrect = correctOptionIds(question).includes(quizState.selectedOption);
  const completedLevel = quizState.completedLevel + (isCorrect ? 1 : 0);
  setQuizState({
    ...quizState,
    phase: 'locked',
    feedbackVisible: false,
    feedbackRevealAt: now + FEEDBACK_REVEAL_DELAY_MS,
    feedbackEndsAt: now + FEEDBACK_REVEAL_DELAY_MS + FEEDBACK_DELAY_MS,
    answers: [
      ...quizState.answers,
      {
        level: quizState.questionIndex + 1,
        questionId: question.id,
        selectedOption: quizState.selectedOption,
        isCorrect,
        lockedAt: new Date(now).toISOString(),
      },
    ],
    score: completedLevel,
    completedLevel,
  });

  return { ok: true };
}

function useLifeline(type) {
  const question = currentQuestion();

  if (!LIFELINE_TYPES.includes(type)) {
    return { ok: false, message: 'That lifeline is not supported.' };
  }
  if (quizState.status !== 'running' || quizState.phase !== 'answering') {
    return { ok: false, message: 'Lifelines can only be used before selecting an answer.' };
  }
  if (expireQuestionIfDue()) return { ok: false, message: 'Time is up for this question.' };
  if (quizState.activeLifeline) {
    return { ok: false, message: 'Finish the active lifeline before using another one.' };
  }
  if (quizState.lifelines[type]?.used) {
    return { ok: false, message: 'That lifeline has already been used.' };
  }

  const activatedAt = new Date(now).toISOString();
  const lifelines = {
    ...quizState.lifelines,
    [type]: { used: true, activatedAt },
  };
  const nextState = { ...quizState, lifelines };

  if (type === 'fiftyFifty') {
    const correctId = correctOptionIds(question)[0];
    nextState.eliminatedOptionIds = shuffle(
      question.options.filter((option) => option.id !== correctId).map((option) => option.id),
    ).slice(0, 2);
  } else {
    nextState.activeLifeline = type;
  }

  setQuizState(nextState);
  return { ok: true };
}

function dismissLifeline() {
  if (quizState.status !== 'running' || !quizState.activeLifeline) {
    return { ok: false, message: 'There is no active lifeline to finish.' };
  }

  setQuizState({ ...quizState, activeLifeline: null });
  return { ok: true };
}

function restartQuiz() {
  if (quizState.status !== 'finished') {
    return { ok: false, message: 'Play Again is only available after the quiz finishes.' };
  }

  setQuizState(createIdleState());
  return { ok: true };
}

function startQuiz() {
  if (quizState.status !== 'idle') {
    return { ok: false, message: 'The quiz has already started.' };
  }

  setQuizState(createRegistrationState());
  return { ok: true };
}

function updatePlayerName(name) {
  if (quizState.status !== 'registering') {
    return { ok: false, message: 'Names can only be changed during registration.' };
  }

  setQuizState({
    ...quizState,
    playerName: sanitizePlayerName(name),
    registrationExpiresAt: now + REGISTRATION_IDLE_TIMEOUT_MS,
  });
  return { ok: true, name: quizState.playerName };
}

function submitPlayerName() {
  if (quizState.status !== 'registering') {
    return { ok: false, message: 'The quiz is not accepting a name right now.' };
  }

  if (!hasValidPlayerName(quizState.playerName)) {
    return { ok: false, message: 'Enter at least 2 characters to continue.' };
  }

  setQuizState({
    ...quizState,
    status: 'running',
    phase: 'answering',
    questionStartedAt: now,
    questionDeadline: now + QUESTION_DURATION_MS,
    questionRemainingMs: QUESTION_DURATION_MS,
    registrationExpiresAt: null,
  });
  return { ok: true };
}

function leaveRegistration() {
  if (quizState.status !== 'registering') {
    return { ok: false, message: 'Back is only available during registration.' };
  }

  setQuizState(createIdleState());
  return { ok: true };
}

function expireQuestionIfDue() {
  if (quizState.status !== 'running' || quizState.phase !== 'answering') return false;
  if (quizState.questionDeadline > now) return false;
  finishRun(createOutcome({ failedLevel: quizState.questionIndex + 1 }), { timedOut: true });
  return true;
}

function performGameAction(action, payload = {}) {
  switch (action) {
    case 'start': return startQuiz();
    case 'name_update': return updatePlayerName(payload.name);
    case 'name_submit': return submitPlayerName();
    case 'registration_back': return leaveRegistration();
    case 'select_option': return selectOption(payload.optionId);
    case 'answer_back': return goBack();
    case 'lock_answer': return lockAnswer();
    case 'continue_feedback': return continueFeedback(payload);
    case 'use_lifeline': return useLifeline(payload.type);
    case 'dismiss_lifeline': return dismissLifeline();
    case 'restart': return restartQuiz();
    case 'show_leaderboard': return showLeaderboard();
    case 'hide_leaderboard': return hideLeaderboard();
    default: return { ok: false, message: 'Unknown game action.' };
  }
}

function settle() {
  if (quizState.status === 'registering' && quizState.registrationExpiresAt <= now) setQuizState(createIdleState());
  if (quizState.status !== 'running') return;
  expireQuestionIfDue();
  if (quizState.phase === 'locked' && quizState.feedbackRevealAt <= now) {
    setQuizState({ ...quizState, phase: 'feedback', feedbackVisible: true });
  }
  if (quizState.phase === 'feedback' && quizState.feedbackEndsAt <= now) {
    advanceAfterFeedback(quizState.runId, quizState.questionIndex);
  }
}
function answer(payload) {
  if (quizState.status !== 'running' || !['answering', 'confirming'].includes(quizState.phase)
    || payload?.sessionId !== quizState.runId || payload?.questionId !== currentQuestion()?.id) {
    return { ok: false, message: 'This question is no longer active.' };
  }
  return { ok: true, sessionId: quizState.runId, questionId: currentQuestion().id, correctOptionIds: correctOptionIds(currentQuestion()) };
}
return { settle, action: performGameAction, answer, publicState: createPublicQuizState, get state() { return quizState; }, get changed() { return changed; } };
}

