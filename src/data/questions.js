export const quizConfig = {
  questionCount: 5,
  secondsPerQuestion: 10,
};

export const questions = [
  {
    id: 'q1',
    text: 'FreeStyle Libre 2 Plus provides glucose readings at what frequency?',
    options: [
      { id: 'a', text: 'Every 5 minutes' },
      { id: 'b', text: 'Every 15 minutes' },
      { id: 'c', text: 'Every hour' },
      { id: 'd', text: 'Every minute' },
    ],
    correctOptionId: 'd',
  },
  {
    id: 'q2',
    text: 'How long can the FreeStyle Libre 2 Plus sensor be worn?',
    options: [
      { id: 'a', text: '7 days' },
      { id: 'b', text: '10 days' },
      { id: 'c', text: '15 days' },
      { id: 'd', text: '30 days' },
    ],
    correctOptionId: 'c',
  },
  {
    id: 'q3',
    text: 'Which app is commonly used with FreeStyle Libre sensors?',
    options: [
      { id: 'a', text: 'LibreLinkUp' },
      { id: 'b', text: 'Photo Gallery' },
      { id: 'c', text: 'Music Player' },
      { id: 'd', text: 'Calculator' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 'q4',
    text: 'What type of reading does FreeStyle Libre help monitor?',
    options: [
      { id: 'a', text: 'Blood pressure' },
      { id: 'b', text: 'Glucose' },
      { id: 'c', text: 'Body temperature' },
      { id: 'd', text: 'Step count' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q5',
    text: 'What does the sensor help users do without routine finger pricks?',
    options: [
      { id: 'a', text: 'Track glucose trends' },
      { id: 'b', text: 'Print reports' },
      { id: 'c', text: 'Charge a phone' },
      { id: 'd', text: 'Measure height' },
    ],
    correctOptionId: 'a',
  },
];
