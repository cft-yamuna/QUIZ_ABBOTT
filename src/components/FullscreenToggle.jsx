import { useEffect, useState } from 'react';

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const isSupported = Boolean(document.documentElement.requestFullscreen);

  useEffect(() => {
    function updateFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener('fullscreenchange', updateFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      // Some tablet browsers only allow fullscreen from specific user gestures.
    }
  }

  if (!isSupported) return null;

  return (
    <button
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className={`fullscreen-toggle ${isFullscreen ? 'is-active' : ''}`}
      onClick={toggleFullscreen}
      type="button"
    >
      <span aria-hidden="true" />
    </button>
  );
}
