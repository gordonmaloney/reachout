function BrushStroke({ variant = 0 }) {
  const brush = brushVariants[variant % brushVariants.length];

  return (
    <img
      src={brush.src}
      alt=""
      style={{
        ...styles.wordBrush,
        transform: brush.transform,
      }}
      aria-hidden="true"
    />
  );
}

function renderTitle(title, accentPhrase, accentVariant) {
  if (!accentPhrase || !title.includes(accentPhrase)) return title;

  const [before, afterStart] = title.split(accentPhrase);

  return (
    <>
      {before}
      <span style={styles.accentWord}>
        {accentPhrase}
        <BrushStroke variant={accentVariant} />
      </span>
      {afterStart}
    </>
  );
}

export default function StageShell({
  title,
  subtitle,
  stageNumLabel,
  children,
  allowOverflow = false,
  accentPhrase,
  accentVariant = 0,
}) {
  return (
    <div
      style={{
        ...styles.shell,
        ...(allowOverflow ? styles.shellAllowOverflow : {}),
      }}
      className="stage-shell bg-texture"
    >
      <div style={styles.header}>
        {stageNumLabel && <span style={styles.stageNum}>{stageNumLabel}</span>}
        <h2 style={styles.title} className="glow-text">
          {renderTitle(title, accentPhrase, accentVariant)}
        </h2>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      <div
        style={{
          ...styles.content,
          ...(allowOverflow ? styles.contentAllowOverflow : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}

const styles = {
  shell: {
    padding: '36px',
    backgroundColor: 'color-mix(in srgb, var(--ta-dark) 72%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '18px',
    height: 'auto',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: '28px',
    position: 'relative',
    overflow: 'visible',
    width: '100%',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
  },
  shellAllowOverflow: {
    height: 'auto',
    minHeight: '100%',
    overflow: 'visible',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid var(--ta-border-subtle)',
    paddingBottom: '20px',
    position: 'relative',
    zIndex: 1,
  },
  stageNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-green)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(40px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-cream)',
    letterSpacing: '0.025em',
    lineHeight: 0.95,
  },
  accentWord: {
    position: 'relative',
    display: 'inline-block',
    zIndex: 1,
  },
  wordBrush: {
    position: 'absolute',
    left: '-0.08em',
    right: '-0.06em',
    bottom: '-0.14em',
    width: 'calc(100% + 0.14em)',
    height: '0.24em',
    zIndex: -1,
    transformOrigin: 'left center',
    opacity: 0.92,
    pointerEvents: 'none',
    objectFit: 'fill',
  },
  subtitle: {
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted-strong)',
    fontWeight: '300',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1,
    minHeight: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  contentAllowOverflow: {
    flex: '0 0 auto',
    minHeight: 'auto',
  }
};

const brushVariants = [
  {
    src: '/brand-assets/brush-contacts.png',
    transform: 'rotate(-1.4deg)',
  },
  {
    src: '/brand-assets/brush-messages.png',
    transform: 'rotate(0.9deg)',
  },
  {
    src: '/brand-assets/brush-call-notes.png',
    transform: 'rotate(-0.5deg)',
  },
  {
    src: '/brand-assets/brush-start.png',
    transform: 'rotate(1.5deg)',
  },
];
