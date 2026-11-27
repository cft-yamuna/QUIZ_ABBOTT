// The approved Indeed FutureWorks logo (white, 360x102) from /public. The pale
// screens need it in brand blue, so it's used as a mask and filled with the
// variant's colour; one file serves every screen.
const LOGO_URL = `${import.meta.env.BASE_URL}${encodeURIComponent('Indeed FutureWorks · Approved logo.png')}`;

export default function Logo({ variant = 'white', className = '' }) {
  return (
    <span
      aria-label="Indeed and Glassdoor FutureWorks Bengaluru"
      className={`logo logo--${variant} ${className}`}
      role="img"
      style={{ '--logo-url': `url("${LOGO_URL}")` }}
    />
  );
}
