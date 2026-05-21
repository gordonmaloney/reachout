import { FileText } from 'lucide-react';

export default function JourneyNav({ activeStage, setActiveStage, onToggleHelp, isOrganiser = false }) {
  const steps = [
    {
      id: 1,
      title: 'IMPORT CONTACTS',
      sub: 'Add or paste your contacts'
    },
    {
      id: 2,
      title: 'WRITE MESSAGES',
      sub: 'Create your templates'
    },
    ...(isOrganiser
      ? [
          {
            id: 3,
            title: 'CALL NOTES & REPORTBACKS',
            sub: 'Add prompts and reportback questions'
          },
          {
            id: 4,
            title: 'START CONTACTING',
            sub: 'Use your phonebank links'
          }
        ]
      : [
          {
            id: 3,
            title: 'START CONTACTING',
            sub: 'Use your pre-filled WhatsApp and SMS links'
          }
        ])
  ];

  return (
    <nav style={styles.navContainer}>
      <div style={styles.journeyHeader}>SET UP YOUR REACHOUT</div>
      
      <div style={styles.stepsWrapper}>
        <div style={styles.connectingLine}></div>
        
        {steps.map((step) => {
          const isActive = activeStage === step.id;
          const isPast = activeStage > step.id;
          
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStage(step.id)}
              aria-current={isActive ? 'step' : undefined}
              style={{
                ...styles.stepRow,
                ...(isActive ? styles.stepRowActive : {}),
              }}
            >
              <div style={{
                ...styles.circle,
                ...(isActive ? styles.circleActive : {}),
                ...(isPast ? styles.circlePast : {})
              }}>
                {step.id}
              </div>
              
              <div style={styles.stepTextGroup}>
                <span style={{
                  ...styles.stepTitle,
                  ...(isActive ? styles.stepTitleActive : {}),
                  ...(isPast ? styles.stepTitlePast : {})
                }}>{step.title}</span>
                <span style={{
                  ...styles.stepSub,
                  ...(isActive ? styles.stepSubActive : {}),
                  ...(isPast ? styles.stepSubPast : {})
                }}>{step.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* NEED HELP */}
      <div style={styles.helpBox} className="glass-card">
        <h4 style={styles.helpTitle}>NEED HELP?</h4>
        <p style={styles.helpDesc}>Learn how REACHOUT works and how to use it on your phone.</p>
        <button onClick={onToggleHelp} style={styles.guideBtn} className="hover-lift">
          <FileText size={14} />
          <span>VIEW GUIDE</span>
        </button>
      </div>

      {/* ORGANISING IMPRINT */}
      <div style={styles.imprintRow}>
        <img
          src="/brand-assets/living-rent-logo.png"
          alt="Living Rent"
          style={styles.imprintLogo}
        />
        <span style={styles.imprintText}>
          Built by members of Living Rent, Scotland's tenants' union.
        </span>
      </div>
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
  journeyHeader: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--ta-green)',
    letterSpacing: '0.1em',
    marginBottom: '28px',
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
  circle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--ta-dark-2)',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    color: 'rgba(247, 244, 236, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontFamily: 'var(--font-heading)',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  circleActive: {
    borderColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    backgroundColor: 'var(--ta-green)',
    boxShadow: 'none',
  },
  circlePast: {
    borderColor: 'var(--ta-green)',
    color: 'var(--ta-green)',
    backgroundColor: 'rgba(79, 159, 104, 0.1)',
  },
  stepTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: '2px',
  },
  stepTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    letterSpacing: '0.05em',
    color: 'rgba(247, 244, 236, 0.35)',
    transition: 'color 0.3s ease',
  },
  stepTitleActive: {
    color: 'var(--ta-green)',
    textShadow: 'none',
  },
  stepTitlePast: {
    color: 'rgba(247, 244, 236, 0.8)',
  },
  stepSub: {
    fontSize: '12px',
    color: 'rgba(247, 244, 236, 0.25)',
    lineHeight: '1.3',
  },
  stepSubActive: {
    color: 'rgba(247, 244, 236, 0.65)',
  },
  stepSubPast: {
    color: 'rgba(247, 244, 236, 0.5)',
  },
  helpBox: {
    backgroundColor: 'rgba(244, 239, 228, 0.03)',
    border: '1px solid rgba(244, 239, 228, 0.09)',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px',
    marginTop: '40px',
  },
  helpTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    color: 'var(--ta-green)',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  helpDesc: {
    fontSize: '12px',
    color: 'rgba(247, 244, 236, 0.65)',
    lineHeight: '1.4',
    marginBottom: '14px',
  },
  guideBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(247, 244, 236, 0.24)',
    color: 'var(--ta-cream)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    width: '100%',
  },
  imprintRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    paddingLeft: '2px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(244, 239, 228, 0.08)',
  },
  imprintLogo: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
    filter: 'grayscale(1) contrast(1.05)',
    opacity: 0.76,
    flexShrink: 0,
  },
  imprintText: {
    fontSize: '11px',
    color: 'rgba(247, 244, 236, 0.48)',
    lineHeight: 1.35,
  }
};
