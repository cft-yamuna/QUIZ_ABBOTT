export const quizConfig = {
  secondsPerQuestion: 10,
  // "3 Choices Per Question" on How it works is the design's copy. Question 5
  // is true/false and only has two.
  choicesPerQuestion: 3,
};

/*
 * The six Talent Challenge questions, in the fixed order the Figma frames
 * show them. "Your Quiz, Explained" numbers its cards 1-6 against this
 * order, so the questions are deliberately not shuffled.
 *
 * `track` splits the quiz in two halves that drive the talent title:
 * 1, 3 and 5 test employer branding; 2, 4 and 6 test Indeed's hiring products.
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

/*
 * The Figma file lists eight titles but doesn't say which score earns which.
 * This mapping is our assumption: a perfect score is the Champion, a clean
 * sweep of one half names that strength, and the rest step down by how much
 * of each half was right.
 */
export function getTalentTitle(answers) {
  const correct = { brand: 0, hiring: 0 };
  const total = { brand: 0, hiring: 0 };

  questions.forEach((question) => {
    total[question.track] += 1;
    if (isAnswerCorrect(question, answers?.[question.id])) correct[question.track] += 1;
  });

  const { brand, hiring } = correct;

  if (brand === total.brand && hiring === total.hiring) return 'Talent Strategy Champion';
  if (brand === total.brand) return 'Employer Branding Expert';
  if (hiring === total.hiring) return 'Hiring Maestro';
  if (brand >= 2 && hiring >= 2) return 'Talent All-Rounder';
  if (brand >= 2) return 'Employer Brand Builder';
  if (hiring >= 2) return 'Hiring Pro';
  if (brand >= 1 && hiring >= 1) return 'Rising Talent Strategist';
  return 'Talent Explorer';
}
