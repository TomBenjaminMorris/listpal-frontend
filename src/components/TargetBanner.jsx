import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import closeIcon from '../assets/icons8-close-50-white.png';
import './TargetBanner.css';

const SLIDE_MS = 400;
const COLLAPSE_MS = 200;
const AUTO_DISMISS_MS = 7000;

const BANNER_COPY = {
  weekly: { emoji: '🎉', title: 'Weekly Target Hit', body: 'Congratulations, you have hit your weekly target!' },
  monthly: { emoji: '🏆', title: 'Monthly Target Hit', body: 'Congratulations, you have hit your monthly target!' },
  yearly: { emoji: '🥇', title: 'Yearly Target Hit', body: 'Congratulations, you have hit your yearly target!' },
};

// After sliding out, the slot collapses so the banners above drop down smoothly rather than jumping
const PHASE_MS = { in: AUTO_DISMISS_MS, out: SLIDE_MS, collapse: COLLAPSE_MS };
const NEXT_PHASE = { in: 'out', out: 'collapse' };

const Banner = ({ type, onDone }) => {
  const [phase, setPhase] = useState('in');
  const copy = BANNER_COPY[type];

  useEffect(() => {
    const timer = setTimeout(() => (NEXT_PHASE[phase] ? setPhase(NEXT_PHASE[phase]) : onDone(type)), PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className={`target-banner-slot${phase === 'collapse' ? ' target-banner-slot-collapse' : ''}`}>
      <div className="target-banner-slot-inner">
        <div className={`target-banner target-banner-${phase === 'in' ? 'in' : 'out'}`}>
          <img className="target-banner-icon" src="/listpal-icon.png" alt="" />
          <div className="target-banner-text">
            <div className="target-banner-title">{copy.title} {copy.emoji}</div>
            <div className="target-banner-body">{copy.body}</div>
          </div>
          <button className="target-banner-close" aria-label="Dismiss" onClick={() => phase === 'in' && setPhase('out')}>
            <img src={closeIcon} alt="" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Shows every banner at once as macOS-style notifications stacked upwards from the bottom right, each closing on its own timer
const TargetBanner = ({ banners, onDone }) => {
  if (!banners.length) return null;

  return createPortal(
    <div className="target-banner-stack">
      {banners.map(type => <Banner key={type} type={type} onDone={onDone} />)}
    </div>,
    document.body
  );
};

export default TargetBanner;
