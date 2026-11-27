import { Fragment, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CtaButton from '../components/CtaButton.jsx';
import Logo from '../components/Logo.jsx';
import { startParticipant } from '../utils/storage.js';

/*
 * The three fields share one Figma template (1080x112, r12), stacked 20px
 * apart; only `top` differs, and that lives in the CSS modifier.
 * autoComplete is off on every field so the kiosk never offers the previous
 * player's details.
 */
const PHONE_DIGITS = 10;

const FIELDS = [
  { key: 'name', label: 'Your name', placeholder: 'Your name', type: 'text', maxLength: 40 },
  { key: 'email', label: 'Email', placeholder: 'Email', type: 'email', inputMode: 'email', maxLength: 80 },
  // Digits only, and typing stops at the 10th.
  {
    key: 'phone',
    label: 'Phone number',
    placeholder: 'Phone Number',
    type: 'tel',
    inputMode: 'numeric',
    maxLength: PHONE_DIGITS,
    sanitize: (value) => value.replace(/\D/g, '').slice(0, PHONE_DIGITS),
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The brief asks for "work email or phone", so either one is enough.
const CONTACT_MISSING = 'Please enter your email or phone number.';

function validate({ name, email, phone }) {
  const errors = {};
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

  if (!name.trim()) errors.name = 'Please enter your name to continue.';

  if (!trimmedEmail && !trimmedPhone) {
    errors.email = CONTACT_MISSING;
    errors.phone = CONTACT_MISSING;
    return errors;
  }

  if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  // The input only holds digits, so all that's left to check is that there are exactly 10.
  if (trimmedPhone && trimmedPhone.length !== PHONE_DIGITS) {
    errors.phone = 'Please enter a valid 10-digit phone number.';
  }

  return errors;
}

// Figma frame "02 — Your name"
export default function NamePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({});

  function handleChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      // Email and phone share the "one of the two" error, so typing in either clears both.
      if (current[key] === CONTACT_MISSING) {
        delete next.email;
        delete next.phone;
      }
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(values);
    const firstInvalid = FIELDS.find((field) => nextErrors[field.key]);

    if (firstInvalid) {
      setErrors(nextErrors);
      inputRefs.current[firstInvalid.key]?.focus();
      return;
    }

    startParticipant(values);
    navigate('/how-it-works');
  }

  // One message at a time, in field order; every invalid field still gets the red ring.
  const message = FIELDS.map((field) => errors[field.key]).find(Boolean);

  return (
    <section className="screen screen--mist name-screen" aria-label="Your details">
      <div className="shape name-screen__capsule" aria-hidden="true" />
      <div className="shape name-screen__circle" aria-hidden="true" />
      <Logo variant="blue" className="name-screen__logo" />

      <h1 className="name-screen__title">First, let's get to know you.</h1>
      <p className="name-screen__lede">Enter your name to personalise your experience.</p>

      <form onSubmit={handleSubmit} noValidate>
        {FIELDS.map((field, index) => {
          const id = `participant-${field.key}`;
          const invalid = Boolean(errors[field.key]);

          return (
            <Fragment key={field.key}>
              <label className="sr-only" htmlFor={id}>{field.label}</label>
              <input
                aria-describedby={invalid ? 'participant-details-error' : undefined}
                aria-invalid={invalid}
                autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                autoComplete="off"
                autoFocus={index === 0}
                className={`name-screen__input name-screen__input--${field.key}`}
                id={id}
                inputMode={field.inputMode}
                maxLength={field.maxLength}
                onChange={(event) => {
                  const { value } = event.target;
                  handleChange(field.key, field.sanitize ? field.sanitize(value) : value);
                }}
                placeholder={field.placeholder}
                ref={(element) => {
                  inputRefs.current[field.key] = element;
                }}
                spellCheck={false}
                type={field.type}
                value={values[field.key]}
              />
            </Fragment>
          );
        })}

        <CtaButton className="name-screen__cta" type="submit" variant="dark">
          Start
        </CtaButton>

        {message && (
          <p className="name-screen__error" id="participant-details-error" role="alert">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
