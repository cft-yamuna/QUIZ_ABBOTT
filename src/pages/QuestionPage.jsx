import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CountdownRing from '../components/CountdownRing.jsx';
import Logo from '../components/Logo.jsx';
import { questions, quizConfig } from '../data/questions.js';
import { getCurrentParticipant, recordAnswer } from '../utils/storage.js';

// How long the tapped answer stays highlighted before the next question.
const ANSWER_HOLD_MS = 700;

// Figma frames "04 — Question 1" to "09 — Question 6"
export default function QuestionPage() {
  const { questionNumber } = useParams();
  const index = Number(questionNumber) - 1;
  const question = questions[index];

  if (!getCurrentParticipant()) {
    return <Navigate to="/name" replace />;
  }

  if (!question) {
    return <Navigate to="/quiz/1" replace />;
  }

  // Keyed so each question mounts fresh with a full timer and no selection.
  return <QuestionScreen index={index} key={question.id} question={question} />;
}

function QuestionScreen({ index, question }) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(quizConfig.secondsPerQuestion);
  const hasAdvancedRef = useRef(false);
  const isLastQuestion = index === questions.length - 1;

  const advance = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    navigate(isLastQuestion ? '/wrap' : `/quiz/${index + 2}`);
  }, [index, isLastQuestion, navigate]);

  // Count down until an answer is picked; running out moves on unanswered.
  useEffect(() => {
    if (selectedId) return undefined;

    if (secondsLeft <= 0) {
      advance();
      return undefined;
    }

    const timerId = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timerId);
  }, [advance, secondsLeft, selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;

    const holdId = window.setTimeout(advance, ANSWER_HOLD_MS);
    return () => window.clearTimeout(holdId);
  }, [advance, selectedId]);

  function choose(optionId) {
    if (selectedId) return;
    recordAnswer(question.id, optionId);
    setSelectedId(optionId);
  }

  return (
    <section className="screen screen--mist question" aria-label={`Question ${index + 1} of ${questions.length}`}>
      <Logo variant="blue" className="question__logo" />

      <div className="question__progress" aria-hidden="true">
        {questions.map((item, itemIndex) => (
          <span className={itemIndex <= index ? 'is-done' : ''} key={item.id} />
        ))}
      </div>

      <CountdownRing seconds={secondsLeft} total={quizConfig.secondsPerQuestion} />

      <p className="question__count">Question {index + 1} of {questions.length}</p>
      <h1 className="question__text" style={question.textWidth ? { width: question.textWidth } : undefined}>
        {question.text}
      </h1>

      <div className="question__answers">
        {question.options.map((option, optionIndex) => (
          <button
            aria-pressed={selectedId === option.id}
            className={`answer ${selectedId === option.id ? 'is-selected' : ''}`}
            disabled={Boolean(selectedId)}
            key={option.id}
            onClick={() => choose(option.id)}
            type="button"
          >
            <span className="answer__letter">{String.fromCharCode(65 + optionIndex)}</span>
            <span className="answer__text">{option.text}</span>
          </button>
        ))}
      </div>

      <p className="question__hint">Tap one answer to continue.</p>
    </section>
  );
}
