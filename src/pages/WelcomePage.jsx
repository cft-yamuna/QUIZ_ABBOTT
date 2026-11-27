import { useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';

// Figma frame "01 — Welcome"
export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <section className="screen screen--navy welcome" aria-label="Welcome">
      <div className="shape welcome__capsule" aria-hidden="true" />
      <div className="shape welcome__circle" aria-hidden="true" />
      <div className="shape welcome__bar" aria-hidden="true" />
      <Logo className="welcome__logo" />

      <h1 className="welcome__title">
        The 90-Second
        <br />
        Talent Challenge
      </h1>
      <p className="welcome__lede">Put your talent strategy knowledge to the test.</p>

      <CtaButton className="welcome__cta" onClick={() => navigate('/name')}>
        Let’s get started
      </CtaButton>
    </section>
  );
}
