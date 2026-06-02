import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import StartPage from './pages/StartPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ScorePage from './pages/ScorePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import congratsFrame from './images/cong.png';
import emailField from './images/email.png';
import leaderboardArtwork from './images/fp5.png';
import nameField from './images/name.png';
import quizArtwork from './images/fp3.png';
import registerArtwork from './images/fp2.png';
import resultArtwork from './images/fp4.png';
import startArtwork from './images/fp1.png';
import startButton from './images/start.png';
import submitButton from './images/submit.png';

const PRELOAD_IMAGES = [
  startArtwork,
  registerArtwork,
  quizArtwork,
  resultArtwork,
  leaderboardArtwork,
  congratsFrame,
  nameField,
  emailField,
  startButton,
  submitButton,
];

function preloadImages() {
  PRELOAD_IMAGES.forEach((src) => {
    const link = document.createElement('link');
    link.as = 'image';
    link.href = src;
    link.rel = 'preload';
    document.head.appendChild(link);

    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    image.decode?.().catch(() => {});
  });
}

preloadImages();

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/quiz/:questionNumber" element={<QuizPage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
