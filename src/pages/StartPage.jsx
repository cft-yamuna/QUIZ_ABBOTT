import { useNavigate } from 'react-router-dom';
import welcomeArtwork from '../images/fp1.png';
import startButton from '../images/start.png';

export default function StartPage() {
  const navigate = useNavigate();

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
      <button className="start-image-button" onClick={() => navigate('/register')} type="button">
        <img src={startButton} alt="Start" decoding="async" loading="eager" />
      </button>
    </section>
  );
}
