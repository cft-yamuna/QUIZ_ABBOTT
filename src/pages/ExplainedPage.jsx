import { useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';
import { questions } from '../data/questions.js';
import { clearCurrentParticipant } from '../utils/storage.js';

// Figma frame "11 — Your result" (the second one): questions 1-3 down the left
// column, 4-6 down the right.
export default function ExplainedPage() {
  const navigate = useNavigate();

  function finish() {
    clearCurrentParticipant();
    navigate('/', { replace: true });
  }

  return (
    <section className="screen screen--navy explained" aria-label="Your quiz, explained">
      <div className="shape explained__capsule" aria-hidden="true" />
      <Logo className="explained__logo" />

      <h1 className="explained__title">Your Quiz, Explained</h1>

      <ol className="explained__list">
        {questions.map((question, index) => (
          <li className={`explained__item explained__item--${index + 1}`} key={question.id}>
            <span className="explained__number" aria-hidden="true">{index + 1}</span>
            <p className="explained__card">{question.explanation}</p>
          </li>
        ))}
      </ol>

      <CtaButton className="explained__cta" onClick={finish}>
        Got it!
      </CtaButton>
    </section>
  );
}
