// Figma group "10 s": a 141.12 disc with a 10.64-wide dashed stroke drawn
// inside its edge. The design only shows the full ring, so as time runs out
// the elapsed dashes fade to the progress bar's idle colour.
const SIZE = 141.12;
const CENTER = SIZE / 2;
const STROKE = 10.64;
const RADIUS = CENTER - STROKE / 2;
const DASH = 4.09;

export default function CountdownRing({ seconds, total }) {
  const remaining = Math.max(0, Math.min(1, seconds / total));

  return (
    <div className="countdown" role="timer" aria-label={`${seconds} seconds remaining`}>
      <svg aria-hidden="true" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <mask id="countdown-remaining">
            <circle
              className="countdown__sweep"
              cx={CENTER}
              cy={CENTER}
              fill="none"
              pathLength="1"
              r={RADIUS}
              stroke="#fff"
              strokeDasharray="1 1"
              strokeDashoffset={1 - remaining}
              strokeWidth={STROKE + 2}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </mask>
        </defs>
        <circle className="countdown__face" cx={CENTER} cy={CENTER} r={CENTER} />
        <circle
          className="countdown__dashes countdown__dashes--spent"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={`${DASH} ${DASH}`}
          strokeWidth={STROKE}
        />
        <circle
          className="countdown__dashes"
          cx={CENTER}
          cy={CENTER}
          mask="url(#countdown-remaining)"
          r={RADIUS}
          strokeDasharray={`${DASH} ${DASH}`}
          strokeWidth={STROKE}
        />
      </svg>
      <span className="countdown__value" aria-hidden="true">
        <span className="countdown__number">{seconds}</span>
        <span className="countdown__unit"> s</span>
      </span>
    </div>
  );
}
