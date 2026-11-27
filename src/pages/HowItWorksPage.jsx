import { Navigate, useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';
import { questions, quizConfig } from '../data/questions.js';
import { getCurrentParticipant } from '../utils/storage.js';

const RULES = [
  { value: questions.length, label: 'Questions' },
  { value: quizConfig.choicesPerQuestion, label: ['Choices Per', 'Question'] },
  { value: quizConfig.secondsPerQuestion, label: ['seconds to answer', 'each question'] },
];

// Figma frame "03 — How it works"
export default function HowItWorksPage() {
  const navigate = useNavigate();

  if (!getCurrentParticipant()) {
    return <Navigate to="/name" replace />;
  }

  return (
    <section className="screen screen--blue how" aria-label="How it works">
      <div className="shape how__blob" aria-hidden="true" />
      <div className="shape how__bar" aria-hidden="true" />
      <Logo className="how__logo" />

      <h1 className="how__title">Ready to put your knowledge to the test?</h1>
      <p className="how__lede">Here's how it works.</p>

      <ul className="how__rules">
        {RULES.map((rule) => (
          <li className="how__rule" key={String(rule.label)}>
            <strong className="how__value">{rule.value}</strong>
            <span className="how__label">
              {[].concat(rule.label).map((line, index) => (
                <span key={line}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <CtaButton className="how__cta" onClick={() => navigate('/quiz/1')}>
        I’m ready
      </CtaButton>
    </section>
  );
}
