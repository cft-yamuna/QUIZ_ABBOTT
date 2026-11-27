import { useEffect, useState } from 'react';

// Every Figma frame is 1920x1080. Screens are laid out in those exact pixels
// and the whole stage is scaled to fit whatever display the kiosk runs on.
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

function getScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

export default function Stage({ children }) {
  const [scale, setScale] = useState(getScale);

  useEffect(() => {
    function updateScale() {
      setScale(getScale());
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="stage-viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
