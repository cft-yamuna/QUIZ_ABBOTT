import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { getCurrentParticipant, saveResult } from '../utils/storage.js';

// Long enough to read the screen; the save carries on in the background.
const WRAP_SCREEN_MS = 3200;

// Figma frame "10 — That’s a wrap"
export default function WrapPage() {
  const navigate = useNavigate();
  const participant = getCurrentParticipant();

  useEffect(() => {
    if (!participant) return undefined;

    saveResult(participant);
    const timerId = window.setTimeout(() => navigate('/result', { replace: true }), WRAP_SCREEN_MS);
    return () => window.clearTimeout(timerId);
  }, [navigate, participant]);

  if (!participant) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="screen screen--navy wrap" aria-label="That's a wrap" aria-busy="true">
      <div className="shape wrap__capsule" aria-hidden="true" />
      <div className="shape wrap__circle" aria-hidden="true" />
      <Logo className="wrap__logo" />

      <h1 className="wrap__title">That's a wrap!</h1>
      <h2 className="wrap__subtitle">
        We're discovering your
        <br />
        talent strategy strengths.
      </h2>
      <p className="wrap__lede">Your results are on the way.</p>

      <div className="wrap__loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
