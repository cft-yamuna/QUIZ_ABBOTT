import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { questions } from '../data/questions.js';
import congratsFrame from '../images/cong.png';
import resultArtwork from '../images/fp4.png';
import {
  calculateScore,
  finalizeCurrentParticipant,
  getCurrentParticipant,
  getParticipantQuestions,
} from '../utils/storage.js';

export default function ScorePage() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [participant, setParticipant] = useState(() => getCurrentParticipant());
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function saveResult() {
      try {
        const activeParticipant = getCurrentParticipant();
        const entry = await finalizeCurrentParticipant(getParticipantQuestions(activeParticipant, questions));
        if (ignore) return;
        setResult(entry);
        setParticipant(getCurrentParticipant());
      } catch (error) {
        if (!ignore) {
          setSaveError(error.message);
        }
      }
    }

    saveResult();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const redirectTimerId = window.setTimeout(() => {
      navigate('/leaderboard');
    }, 5000);

    return () => window.clearTimeout(redirectTimerId);
  }, [navigate]);

  if (!participant) {
    return <Navigate to="/register" replace />;
  }

  const participantQuestions = getParticipantQuestions(participant, questions);
  const score = result?.score ?? calculateScore(participant.answers, participantQuestions);
  const nameLength = participant.fullName.length;
  const nameSizeClass = nameLength > 24 ? 'very-long-name' : nameLength > 12 ? 'long-name' : '';

  return (
    <section className="result-page" aria-label={`Congratulations ${participant.fullName}`}>
      <img
        className="result-artwork"
        src={resultArtwork}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />

      <div className="result-frame">
        <img
          className="result-frame-artwork"
          src={congratsFrame}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          loading="eager"
        />

        <div className="result-copy" aria-label={`You have scored ${score} out of ${participantQuestions.length}`}>
          <h1 className={nameSizeClass}>{participant.fullName}</h1>
          <p>you have scored {score}/{participantQuestions.length}.</p>
        </div>

        {saveError && <p className="result-error">{saveError}</p>}

        <button
          className="result-primary-action"
          onClick={() => navigate('/leaderboard')}
          aria-label="Continue to leaderboard"
          type="button"
        />
      </div>
    </section>
  );
}
