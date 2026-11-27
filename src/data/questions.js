export const quizConfig = {
  // 6 questions x 15 s = the 90 seconds in the challenge's name.
  secondsPerQuestion: 15,
  // "3 Choices Per Question" on How it works is the design's copy. Question 5
  // is true/false and only has two.
  choicesPerQuestion: 3,
};

/*
 * The six Talent Challenge questions, in the fixed order the Figma frames
 * show them. "Your Quiz, Explained" numbers its cards 1-6 against this
 * order, so the questions are deliberately not shuffled.
 *
 * `track` splits the quiz in two halves that drive the talent tag:
 * 1, 3 and 5 are employer branding (EB); 2, 4 and 6 are hiring (H).
 * Scoring only: the brief says never to show these labels to players.
 */
export const questions = [
  {
    id: 'q1',
    track: 'brand',
    text: "Before applying, a candidate asks an AI assistant what it's like to work at your company. What share of candidates changed their mind about a company because of what AI told them?",
    options: [
      { id: 'a', text: '62%' },
      { id: 'b', text: '82%' },
      { id: 'c', text: '98%' },
    ],
    correctOptionId: 'b',
    explanation: '82% of candidates changed their\nmind about a company because of\nwhat AI told them.',
  },
  {
    id: 'q2',
    track: 'hiring',
    text: 'Your company is opening a new capability centre in Bengaluru and needs 20 software engineers within a month. Which Indeed product puts these jobs at the top of search results?',
    options: [
      { id: 'a', text: 'Indeed Hiring Events' },
      { id: 'b', text: 'Premium Sponsored Jobs' },
      { id: 'c', text: 'Employer Branding Ads' },
    ],
    correctOptionId: 'b',
    explanation: 'Premium Sponsored Jobs: Urgently\nHiring and First Page Boost give\ncritical roles maximum visibility in search.',
  },
  {
    id: 'q3',
    track: 'brand',
    text: "Your team is deciding where to invest in employer brand content. According to Indeed's India survey, at which stage do 59% of candidates research an employer?",
    options: [
      { id: 'a', text: 'Before they apply' },
      { id: 'b', text: 'Between applying and the interview' },
      { id: 'c', text: 'After they get an offer' },
    ],
    correctOptionId: 'b',
    explanation: "Candidates keep checking you\neven after they've applied.",
  },
  {
    id: 'q4',
    track: 'hiring',
    text: 'Your new Bengaluru capability centre receives 800 applications for one data analyst role. Which Indeed tool uses AI to score and summarise each one against your criteria?',
    options: [
      { id: 'a', text: 'Hiring Insights' },
      { id: 'b', text: 'Smart Screening' },
      { id: 'c', text: 'Indeed Apply + ATS Integration' },
    ],
    correctOptionId: 'b',
    explanation: 'Smart Screening uses AI to score every\napplication and sends candidate summaries to\nyour ATS. Coming to India in 2027.',
  },
  {
    id: 'q5',
    track: 'brand',
    text: 'Your leadership team believes Brand Score only tracks awareness, with no link to how many candidates actually apply. True or false?',
    // Figma sets this one in a narrower box so it breaks onto three lines.
    textWidth: 1120,
    options: [
      { id: 'a', text: 'True' },
      { id: 'b', text: 'False' },
    ],
    correctOptionId: 'b',
    explanation: 'False. A 10-point rise in Brand\nScore is associated with roughly 14\npercentile points more apply starts.',
  },
  {
    id: 'q6',
    track: 'hiring',
    text: 'Your recruiters spend hours every week copying Indeed applicants into your hiring system by hand. Which Indeed solution sends these applications there automatically?',
    options: [
      { id: 'a', text: 'Smart Screening' },
      { id: 'b', text: 'Indeed Analytics' },
      { id: 'c', text: 'Indeed Apply + ATS Integration' },
    ],
    correctOptionId: 'c',
    explanation: 'Indeed Apply + ATS Integration\nsyncs applications straight into your\nexisting ATS, with no manual work.',
  },
];

export function isAnswerCorrect(question, answer) {
  return Boolean(answer) && answer === question.correctOptionId;
}

export function calculateScore(answers) {
  return questions.filter((question) => isAnswerCorrect(question, answers?.[question.id])).length;
}

// Points per half: employer branding (EB) and hiring (H), 0-3 each.
export function getSectionScores(answers) {
  const scores = { brand: 0, hiring: 0 };

  questions.forEach((question) => {
    if (isAnswerCorrect(question, answers?.[question.id])) scores[question.track] += 1;
  });

  return scores;
}

// Tags and next-step lines, word for word from the engagement brief (section 5).
const TAGS = {
  champion: {
    title: 'Talent Strategy Champion',
    nextStep: "You've mastered both sides. Come see what's next at Indeed.",
  },
  brandingExpert: {
    title: 'Employer Branding Expert',
    nextStep: 'You know what candidates see. Now see how fast you can hire.',
  },
  hiringMaestro: {
    title: 'Hiring Maestro',
    nextStep: 'You can fill roles fast. Now make candidates want to join. Visit the Brand Score Wall.',
  },
  brandBuilder: {
    title: 'Employer Brand Builder',
    nextStep: 'Your brand instincts are strong. See how Indeed turns them into hires.',
  },
  hiringPro: {
    title: 'Hiring Pro',
    nextStep: 'You know your hiring tools. Discover what your Brand Score says about you.',
  },
  allRounder: {
    title: 'Talent All-Rounder',
    nextStep: "Balanced across the board. Let's sharpen both sides.",
  },
  risingStrategist: {
    title: 'Rising Talent Strategist',
    nextStep: 'Great start. Our team can show you where to level up.',
  },
  explorer: {
    title: 'Talent Explorer',
    nextStep: "Every expert starts somewhere. Let's show you around.",
  },
};

/*
 * The brief's tag table: the total picks the band, and within 5/6 and 4/6
 * the EB / H split picks the tag. With three questions per half, 5/6 can only
 * split 3/2 or 2/3, and 4/6 only 3/1, 1/3 or 2/2.
 */
export function getTalentTag(answers) {
  const { brand, hiring } = getSectionScores(answers);
  const total = brand + hiring;

  if (total === 6) return TAGS.champion;
  if (total === 5) return brand === 3 ? TAGS.brandingExpert : TAGS.hiringMaestro;
  if (total === 4) {
    if (brand === 3) return TAGS.brandBuilder;
    if (hiring === 3) return TAGS.hiringPro;
    return TAGS.allRounder;
  }
  if (total === 3) return TAGS.risingStrategist;
  return TAGS.explorer;
}
