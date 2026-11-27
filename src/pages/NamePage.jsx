import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';
import { startParticipant } from '../utils/storage.js';

// Figma frame "02 — Your name"
export default function NamePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }

    startParticipant(name);
    navigate('/how-it-works');
  }

  return (
    <section className="screen screen--mist name-screen" aria-label="Your name">
      <div className="shape name-screen__capsule" aria-hidden="true" />
      <div className="shape name-screen__circle" aria-hidden="true" />
      <Logo variant="blue" className="name-screen__logo" />

      <h1 className="name-screen__title">
        First, let's get
        <br />
        to know you.
      </h1>
      <p className="name-screen__lede">Enter your name to personalise your experience.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="participant-name">Your name</label>
        <input
          aria-describedby={error ? 'participant-name-error' : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          autoFocus
          className="name-screen__input"
          id="participant-name"
          maxLength={40}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError('');
          }}
          placeholder="Your name"
          spellCheck={false}
          type="text"
          value={name}
        />
        {error && (
          <p className="name-screen__error" id="participant-name-error" role="alert">
            {error}
          </p>
        )}

        <CtaButton className="name-screen__cta" type="submit" variant="dark">
          Start
        </CtaButton>
      </form>
    </section>
  );
}
