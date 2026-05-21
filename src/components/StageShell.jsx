function BrushStroke({ variant = 0 }) {
  const brush = brushVariants[variant % brushVariants.length];

  return (
    <svg
      viewBox="0 0 180 22"
      preserveAspectRatio="none"
      style={{
        ...styles.wordBrush,
        transform: brush.transform,
      }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={brush.primary}
        fill="none"
        stroke="rgba(79, 159, 104, 0.78)"
        strokeWidth={brush.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {brush.secondary && (
        <path
          d={brush.secondary}
          fill="none"
          stroke="rgba(79, 159, 104, 0.34)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
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
    backgroundColor: 'rgba(22, 27, 23, 0.72)',
    border: '1px solid rgba(244, 239, 228, 0.09)',
    borderRadius: '18px',
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    position: 'relative',
    overflow: 'hidden',
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
    borderBottom: '1px solid rgba(247, 244, 236, 0.08)',
    paddingBottom: '20px',
    position: 'relative',
    zIndex: 1,
  },
  stageNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--ta-green)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '40px',
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
    bottom: '-0.17em',
    width: 'calc(100% + 0.14em)',
    height: '0.32em',
    zIndex: -1,
    transformOrigin: 'left center',
    opacity: 0.92,
    pointerEvents: 'none',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(247, 244, 236, 0.7)',
    fontWeight: '300',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1,
    minHeight: 0,
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
    primary: 'M5 14 C24 10, 38 15, 57 11 S91 7, 112 11 S147 17, 175 10',
    secondary: 'M19 16 C47 18, 79 12, 113 14 S150 15, 168 12',
    strokeWidth: 8,
    transform: 'rotate(-1.4deg)',
  },
  {
    primary: 'M6 12 C29 17, 45 8, 66 13 S102 18, 124 12 S151 7, 174 13',
    secondary: 'M16 9 C40 11, 64 16, 91 13 S139 11, 164 16',
    strokeWidth: 7,
    transform: 'rotate(0.9deg)',
  },
  {
    primary: 'M4 13 C20 8, 41 9, 61 14 S94 15, 116 10 S152 8, 176 15',
    secondary: 'M13 16 C39 14, 67 17, 96 13 S140 12, 166 10',
    strokeWidth: 8,
    transform: 'rotate(-0.5deg)',
  },
  {
    primary: 'M7 15 C31 11, 53 17, 75 12 S112 6, 133 12 S160 17, 176 11',
    secondary: 'M22 11 C49 8, 73 14, 102 12 S143 15, 162 9',
    strokeWidth: 7,
    transform: 'rotate(1.5deg)',
  },
];
