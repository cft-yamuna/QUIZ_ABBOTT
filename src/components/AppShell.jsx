import { useLocation } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const isStartPage = location.pathname === '/';
  const isQuizPage = location.pathname.startsWith('/quiz/');
  const isScorePage = location.pathname === '/score';
  const isLeaderboardPage = location.pathname === '/leaderboard';
  const isArtworkPage = isStartPage || location.pathname === '/register' || isQuizPage || isScorePage || isLeaderboardPage;

  return (
    <div className={`app ${isArtworkPage ? 'app-artwork' : ''}`}>
      <main className={`page-shell ${isArtworkPage ? 'artwork-shell' : ''}`}>{children}</main>
    </div>
  );
}
