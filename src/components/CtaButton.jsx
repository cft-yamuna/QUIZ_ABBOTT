// The 380x96 pill buttons. "light" is white with blue text (on the navy and
// blue screens); "dark" is the blue Start button on the pale name screen.
export default function CtaButton({ children, className = '', variant = 'light', type = 'button', ...props }) {
  return (
    <button className={`cta cta--${variant} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
