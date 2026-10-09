import { useNavigate } from 'react-router-dom';
import welcomeArtwork from '../images/fp1.png';
import startButton from '../images/start.png';
import { createParticipant } from '../utils/storage.js';

export default function StartPage() {
  const navigate = useNavigate();

  function startQuiz() {
    createParticipant();
    navigate('/quiz/1');
  }

  return (
    <section className="start-page" aria-label="Welcome to the quiz game">
      <img
        className="start-artwork"
        src={welcomeArtwork}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
      <button className="start-image-button" onClick={startQuiz} type="button">
        <img src={startButton} alt="Start" decoding="async" loading="eager" />
      </button>
    </section>
  );
}
