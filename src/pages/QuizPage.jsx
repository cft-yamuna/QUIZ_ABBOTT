import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { questions, quizConfig } from '../data/questions.js';
import { useCurrentParticipant } from '../hooks/useCurrentParticipant.js';
import { getParticipantQuestions, updateParticipantAnswer } from '../utils/storage.js';
import quizArtwork from '../images/fp3.png';

const ANSWER_FEEDBACK_DELAY_MS = 600;

export default function QuizPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams();
  const { participant, refreshParticipant } = useCurrentParticipant();
  const [feedbackOptionId, setFeedbackOptionId] = useState('');
  const [timeLeft, setTimeLeft] = useState(quizConfig.secondsPerQuestion);
  const feedbackTimeoutRef = useRef(null);
  const currentIndex = Number(questionNumber) - 1;
  const quizQuestions = useMemo(() => getParticipantQuestions(participant, questions), [participant]);
  const question = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;

  const selectedOptionId = useMemo(() => {
    return participant?.answers?.[question?.id] || '';
  }, [participant, question]);

  const goNext = useCallback(() => {
    if (currentIndex === totalQuestions - 1) {
      navigate('/score');
      return;
    }

    navigate(`/quiz/${currentIndex + 2}`);
  }, [currentIndex, navigate, totalQuestions]);

  useEffect(() => {
    setFeedbackOptionId('');
    setTimeLeft(quizConfig.secondsPerQuestion);

    return () => {
      window.clearTimeout(feedbackTimeoutRef.current);
    };
  }, [questionNumber]);

  useEffect(() => {
    if (!participant || !question || feedbackOptionId) return undefined;

    if (timeLeft <= 0) {
      goNext();
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [feedbackOptionId, goNext, participant, question, timeLeft]);

  if (!participant) {
    return <Navigate to="/register" replace />;
  }

  if (!question || currentIndex < 0) {
    return <Navigate to="/quiz/1" replace />;
  }

  function selectOption(optionId) {
    if (feedbackOptionId) return;

    updateParticipantAnswer(question.id, optionId);
    refreshParticipant();
    setFeedbackOptionId(optionId);

    feedbackTimeoutRef.current = window.setTimeout(() => {
      goNext();
    }, ANSWER_FEEDBACK_DELAY_MS);
  }

  function getOptionClassName(optionId) {
    const classNames = ['option-card'];

    if (selectedOptionId === optionId) {
      classNames.push('selected');
    }

    if (feedbackOptionId) {
      if (optionId === question.correctOptionId) {
        classNames.push('feedback-correct');
      } else if (optionId === feedbackOptionId) {
        classNames.push('feedback-incorrect');
      }
    }

    return classNames.join(' ');
  }

  return (
    <section className="quiz-page" aria-label={`Question ${currentIndex + 1} of ${totalQuestions}`}>
      <img className="quiz-artwork" src={quizArtwork} alt="" aria-hidden="true" />

      <div className="quiz-ui">
        <div className="quiz-status-row">
          <div className="question-count-chip">
            <span aria-hidden="true">?</span>
            <strong>Question {currentIndex + 1} of {totalQuestions}</strong>
          </div>

          <div
            className="quiz-progress-pills"
            aria-label={`Progress ${currentIndex + 1} of ${totalQuestions}`}
          >
            {quizQuestions.map((item, index) => (
              <span
                className={index <= currentIndex ? 'active' : ''}
                key={item.id}
              />
            ))}
          </div>

          <div className="quiz-timer" aria-label={`${timeLeft} seconds remaining`}>
            <span aria-hidden="true"><i /></span>
            <strong>00:{String(timeLeft).padStart(2, '0')}</strong>
          </div>
        </div>

        <div className="question-panel">
          <div className="question-icon" aria-hidden="true">?</div>
          <p className="question-index">Q{currentIndex + 1}</p>
          <div className="question-copy-wrap">
            <span className="question-sparks left" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <h1>{question.text}</h1>
            <span className="question-sparks right" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>

        <div className="options-grid quiz-options">
          {question.options.map((option) => (
            <button
              className={getOptionClassName(option.id)}
              disabled={Boolean(feedbackOptionId)}
              key={option.id}
              onClick={() => selectOption(option.id)}
              type="button"
            >
              <span>{option.id.toUpperCase()}</span>
              <strong>{option.text}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
