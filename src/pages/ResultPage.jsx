import { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';
import { calculateScore, getTalentTitle, questions } from '../data/questions.js';
import { useFitText } from '../hooks/useFitText.js';
import { getCurrentParticipant } from '../utils/storage.js';

// Figma frame "11 — Your result"
export default function ResultPage() {
  const navigate = useNavigate();
  const participant = getCurrentParticipant();
  const titleRef = useRef(null);
  const talentTitle = participant ? getTalentTitle(participant.answers) : '';

  // Two lines at the design's 70px fill the magenta band; shrink past that.
  useFitText(titleRef, { max: 70, min: 40, maxHeight: 194 }, [talentTitle]);

  if (!participant) {
    return <Navigate to="/" replace />;
  }

  const score = calculateScore(participant.answers);
  const firstName = participant.fullName.split(/\s+/)[0];

  return (
    <section className="screen screen--navy result" aria-label="Your result">
      <div className="shape result__band" aria-hidden="true" />
      <div className="shape result__bar" aria-hidden="true" />
      <div className="shape result__capsule" aria-hidden="true" />
      <div className="shape result__corner" aria-hidden="true" />
      <Logo className="result__logo" />

      <p className="result__score-label">Your final score</p>
      <p className="result__score">{score}/{questions.length}</p>

      <h1 className="result__greeting">Hello {firstName}, your talent title is</h1>
      <div className="result__title">
        <span ref={titleRef}>{talentTitle}</span>
      </div>

      <CtaButton className="result__cta" onClick={() => navigate('/explained')}>
        Next
      </CtaButton>
    </section>
  );
}
