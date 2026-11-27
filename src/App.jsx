import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import FullscreenToggle from './components/FullscreenToggle.jsx';
import Stage from './components/Stage.jsx';
import ExplainedPage from './pages/ExplainedPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import NamePage from './pages/NamePage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import WrapPage from './pages/WrapPage.jsx';
import { setOnWelcomeScreen } from './pwa.js';

// Welcome → Name → How it works → 6 questions → Wrap → Result → Explained → Welcome
export default function App() {
  const { pathname } = useLocation();

  // A new app version waits for the welcome screen before it reloads the kiosk.
  useEffect(() => {
    setOnWelcomeScreen(pathname === '/');
  }, [pathname]);

  return (
    <>
      <Stage>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/name" element={<NamePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/quiz/:questionNumber" element={<QuestionPage />} />
          <Route path="/wrap" element={<WrapPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/explained" element={<ExplainedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Stage>
      <FullscreenToggle />
    </>
  );
}
