import { FileText, Moon, Sun } from 'lucide-react';

export default function JourneyNav({
  activeStage,
  setActiveStage,
  onToggleHelp,
  isOrganiser = false,
  canToggleOrganiser = false,
  organiserModeEnabled = false,
  onToggleOrganiser = () => {},
  onOpenOrganiserInfo = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
  fontScale = 1,
  canDecreaseFontScale = true,
  canIncreaseFontScale = true,
  onDecreaseFontScale = () => {},
  onIncreaseFontScale = () => {},
  onOpenReleaseNotes = () => {},
  tourHighlightStage = null,
  tourHighlightTarget = null,
}) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const fontScalePercent = Math.round(fontScale * 100);
  const steps = [
    {
      id: 1,
      title: "IMPORT CONTACTS",
      sub: "Add or paste your contacts",
    },
    {
      id: 2,
      title: "WRITE MESSAGES",
      sub: "Create your templates",
    },
    ...(isOrganiser
      ? [
          {
            id: 3,
            title: "ORGANISER MODE SETTINGS",
            sub: "Call notes, reportbacks, secure links and more",
          },
          {
            id: 4,
            title: "START CONTACTING",
            sub: "Use your phonebank links",
          },
        ]
      : [
          {
            id: 3,
            title: "START CONTACTING",
            sub: "Use your pre-filled WhatsApp and SMS links",
          },
        ]),
  ];

  return (
    <nav
      style={styles.navContainer}
      className="journey-nav"
      data-stage-count={steps.length}
    >
      <div style={styles.topRow} className="journey-top-row">
        <div style={styles.journeyHeader}>SET UP YOUR REACHOUT</div>
      </div>

      {organiserModeEnabled && (
        <button
          type="button"
          onClick={onOpenOrganiserInfo}
          style={styles.organiserEdition}
          className="journey-organiser-edition"
        >
          <span style={styles.organiserEditionTitle}>Organiser mode</span>
          <span style={styles.organiserEditionText}>Notes, reportbacks and session hosting enabled.</span>
        </button>
      )}
      
      <div style={styles.stepsWrapper} className="journey-steps-wrapper">
        <div style={styles.connectingLine} className="journey-connecting-line"></div>
        
        {steps.map((step) => {
          const isActive = activeStage === step.id;
          const isPast = activeStage > step.id;
          const isTourHighlighted = tourHighlightStage === step.id;
          
          return (
            <button
              key={step.id}
              type="button"
              data-tour-target={`stage-${step.id}`}
              className="journey-step-row"
              onClick={() => setActiveStage(step.id)}
              aria-current={isActive ? 'step' : undefined}
              style={{
                ...styles.stepRow,
                ...(isActive ? styles.stepRowActive : {}),
                ...(isTourHighlighted ? styles.tourSpotlight : {}),
              }}
            >
              <div className="journey-step-circle" style={{
                ...styles.circle,
                ...(isActive ? styles.circleActive : {}),
                ...(isPast ? styles.circlePast : {}),
              }}>
                {step.id}
              </div>
              
              <div style={styles.stepTextGroup} className="journey-step-text">
                <span style={{
                  ...styles.stepTitle,
                  ...(isActive ? styles.stepTitleActive : {}),
                  ...(isPast ? styles.stepTitlePast : {}),
                }}>{step.title}</span>
                <span style={{
                  ...styles.stepSub,
                  ...(isActive ? styles.stepSubActive : {}),
                  ...(isPast ? styles.stepSubPast : {}),
                }}>{step.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {canToggleOrganiser && (
        <div
          data-tour-target="organiser-toggle"
          className="journey-organiser-toggle-box"
          style={{
            ...styles.organiserToggleBox,
            ...(tourHighlightTarget === 'organiser-toggle'
              ? styles.tourSpotlight
              : {}),
          }}
        >
          <div>
            <span style={styles.organiserToggleTitle} className="journey-organiser-toggle-title">Organiser mode</span>
            <p style={styles.organiserToggleText} className="journey-organiser-toggle-text">
              Add call notes, reportbacks and hosting tools.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleOrganiser}
            style={{
              ...styles.switchBtn,
              ...(organiserModeEnabled ? styles.switchBtnActive : {}),
            }}
            className="journey-switch-btn"
            aria-pressed={organiserModeEnabled}
          >
            <span
              style={{
                ...styles.switchKnob,
                ...(organiserModeEnabled ? styles.switchKnobActive : {}),
              }}
              className="journey-switch-knob"
            />
          </button>
        </div>
      )}

      {/* NEED HELP */}
      <div style={styles.helpBox} className="glass-card journey-help-box">
        <h4 style={styles.helpTitle}>NEED HELP?</h4>
        <p style={styles.helpDesc}>Learn how REACHOUT works and how to use it on your phone.</p>
        <button onClick={onToggleHelp} style={styles.guideBtn} className="hover-lift">
          <FileText size={14} />
          <span>View guide</span>
        </button>
      </div>

      <div style={styles.displayBox} className="journey-display-box">
        <div style={styles.displayCopy}>
          <span style={styles.displayTitle}>Display</span>
          <span style={styles.displayHint}>Text size and colour mode</span>
        </div>
        <div style={styles.displayControls} aria-label="Display controls">
          <button
            type="button"
            onClick={onToggleTheme}
            style={styles.displayIconBtn}
            title={`Switch to ${nextTheme} mode`}
            aria-label={`Switch to ${nextTheme} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            type="button"
            onClick={onDecreaseFontScale}
            disabled={!canDecreaseFontScale}
            style={{
              ...styles.fontScaleBtn,
              ...(!canDecreaseFontScale ? styles.fontScaleBtnDisabled : {}),
            }}
            title={`Make text smaller. Current size ${fontScalePercent}%`}
            aria-label={`Make text smaller. Current size ${fontScalePercent}%`}
          >
            A-
          </button>
          <button
            type="button"
            onClick={onIncreaseFontScale}
            disabled={!canIncreaseFontScale}
            style={{
              ...styles.fontScaleBtn,
              ...(!canIncreaseFontScale ? styles.fontScaleBtnDisabled : {}),
            }}
            title={`Make text bigger. Current size ${fontScalePercent}%`}
            aria-label={`Make text bigger. Current size ${fontScalePercent}%`}
          >
            A+
          </button>
        </div>
      </div>

      {/* ORGANISING IMPRINT */}
      <div style={styles.imprintRow} className="journey-imprint-row">
        <img
          src="/brand-assets/living-rent-logo.png"
          alt="Living Rent"
          style={styles.imprintLogo}
        />
        <span style={styles.imprintText}>
          Built by members of Living Rent, Scotland's tenants' union.
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenReleaseNotes}
        style={styles.releaseNotesLink}
      >
        Release notes
      </button>
    </nav>
  );
}

const styles = {
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingRight: '12px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  journeyHeader: {
    fontFamily: 'var(--font-mono)',
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-green)',
    letterSpacing: '0.1em',
    fontWeight: 'bold',
  },
  organiserEdition: {
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'rgba(79, 159, 104, 0.08)',
    border: '1px solid rgba(79, 159, 104, 0.28)',
    borderLeft: '3px solid var(--ta-green)',
    borderRadius: '10px',
    padding: '11px 12px',
    marginBottom: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
  },
  organiserEditionKicker: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--ta-green)',
    fontSize: "calc(10px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  organiserEditionTitle: {
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-cream)',
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
  },
  organiserEditionText: {
    color: 'var(--ta-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
    letterSpacing: 0,
    textTransform: 'none',
  },
  stepsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
    position: 'relative',
    marginBottom: 'auto',
  },
  connectingLine: {
    position: 'absolute',
    left: '19px',
    top: '12px',
    bottom: '12px',
    width: '2px',
    backgroundColor: 'var(--ta-border-subtle)',
    zIndex: 1,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    position: 'relative',
    zIndex: 2,
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: 'none',
  },
  stepRowActive: {
    cursor: 'default',
  },
  tourSpotlight: {
    position: 'relative',
    zIndex: 1201,
  },
  circle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--ta-dark-2)',
    border: '2px solid var(--ta-border-subtle)',
    color: 'var(--ta-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    fontFamily: 'var(--font-heading)',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
    position: 'relative',
    zIndex: 2,
    boxShadow: '0 0 0 4px var(--ta-dark-2)',
  },
  circleActive: {
    borderColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    backgroundColor: 'var(--ta-green)',
    boxShadow: '0 0 0 4px var(--ta-dark-2)',
  },
  circlePast: {
    borderColor: 'var(--ta-green)',
    color: 'var(--ta-green)',
    backgroundColor: 'var(--ta-dark-2)',
    boxShadow: '0 0 0 4px var(--ta-dark-2)',
  },
  stepTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: '2px',
  },
  stepTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    color: 'color-mix(in srgb, var(--ta-cream) 38%, transparent)',
    transition: 'color 0.3s ease',
  },
  stepTitleActive: {
    color: 'var(--ta-green)',
    textShadow: 'none',
  },
  stepTitlePast: {
    color: 'var(--ta-muted-strong)',
  },
  stepSub: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: 'color-mix(in srgb, var(--ta-cream) 34%, transparent)',
    lineHeight: '1.3',
  },
  stepSubActive: {
    color: 'var(--ta-muted)',
  },
  stepSubPast: {
    color: 'var(--ta-muted)',
  },
  helpBox: {
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 3%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
    marginTop: '28px',
  },
  displayBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '10px',
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 2.5%, transparent)',
    padding: '10px 12px',
    marginBottom: '18px',
  },
  displayCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  displayTitle: {
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-cream)',
    fontSize: 'calc(14px * var(--reachout-text-scale, 1))',
    letterSpacing: '0.05em',
  },
  displayHint: {
    color: 'var(--ta-muted)',
    fontSize: 'calc(10.5px * var(--reachout-text-scale, 1))',
    lineHeight: 1.25,
  },
  displayControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    flexShrink: 0,
  },
  displayIconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '999px',
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-subtle)',
    color: 'var(--ta-muted-strong)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  fontScaleBtn: {
    minWidth: '30px',
    height: '30px',
    borderRadius: '999px',
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-subtle)',
    color: 'var(--ta-muted-strong)',
    fontFamily: 'var(--font-body)',
    fontSize: 'calc(11px * var(--reachout-text-scale, 1))',
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'none',
    padding: '0 7px',
  },
  fontScaleBtnDisabled: {
    color: 'color-mix(in srgb, var(--ta-muted) 42%, transparent)',
    cursor: 'not-allowed',
  },
  organiserToggleBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 3%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '10px',
    padding: '14px',
    marginTop: '40px',
    marginBottom: '-16px',
  },
  organiserToggleTitle: {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-green)',
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    marginBottom: '2px',
  },
  organiserToggleText: {
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
    lineHeight: 1.35,
  },
  switchBtn: {
    width: '44px',
    height: '24px',
    borderRadius: '999px',
    border: '1px solid var(--ta-border-medium)',
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 8%, transparent)',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  switchBtnActive: {
    borderColor: 'rgba(79, 159, 104, 0.45)',
    backgroundColor: 'rgba(79, 159, 104, 0.18)',
  },
  switchKnob: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'var(--ta-muted)',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
  },
  switchKnobActive: {
    transform: 'translateX(18px)',
    backgroundColor: 'var(--ta-green)',
  },
  helpTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-green)',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  helpDesc: {
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
    lineHeight: '1.35',
    marginBottom: '10px',
  },
  guideBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-medium)',
    color: 'var(--ta-cream)',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 'bold',
    width: '100%',
  },
  imprintRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    paddingLeft: '2px',
    paddingTop: '10px',
    borderTop: '1px solid var(--ta-border-subtle)',
  },
  imprintLogo: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
    filter: 'none',
    opacity: 0.9,
    flexShrink: 0,
  },
  imprintText: {
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
    lineHeight: 1.35,
  },
  releaseNotesLink: {
    alignSelf: 'flex-start',
    marginTop: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--ta-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: 'calc(11px * var(--reachout-text-scale, 1))',
    letterSpacing: 0,
    textTransform: 'none',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    padding: 0,
    cursor: 'pointer',
  },
};
