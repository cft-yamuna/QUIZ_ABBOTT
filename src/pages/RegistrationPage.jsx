import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailField from '../images/email.png';
import registerArtwork from '../images/fp2.png';
import nameField from '../images/name.png';
import submitButton from '../images/submit.png';
import { createParticipant } from '../utils/storage.js';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    createParticipant(form);
    navigate('/quiz/1');
  }

  return (
    <section className="register-page" aria-label="Participant registration">
      <img
        className="register-artwork"
        src={registerArtwork}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <label className={`image-field ${form.fullName ? 'has-value' : ''}`}>
          <span className="sr-only">Full Name</span>
          <img src={nameField} alt="" aria-hidden="true" decoding="async" loading="eager" />
          <input
            aria-invalid={Boolean(errors.fullName)}
            autoComplete="name"
            name="fullName"
            onChange={updateField}
            placeholder="Enter your name"
            type="text"
            value={form.fullName}
          />
          {errors.fullName && <small className="error">{errors.fullName}</small>}
        </label>

        <label className={`image-field ${form.email ? 'has-value' : ''}`}>
          <span className="sr-only">Email Address</span>
          <img src={emailField} alt="" aria-hidden="true" decoding="async" loading="eager" />
          <input
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            name="email"
            onChange={updateField}
            placeholder="Enter your email"
            type="email"
            value={form.email}
          />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>

        <button className="submit-image-button" type="submit">
          <img src={submitButton} alt="Submit" decoding="async" loading="eager" />
        </button>
      </form>
    </section>
  );
}
