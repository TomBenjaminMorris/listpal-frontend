import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import closeIcon from '../assets/icons8-close-50-white.png';
import './TargetBanner.css';

const SLIDE_MS = 400;
const AUTO_DISMISS_MS = 7000;

const BANNER_COPY = {
  weekly: { emoji: '🎉', title: 'Weekly target smashed', body: "You've hit your weekly target. Take a bow!" },
  monthly: { emoji: '🏆', title: 'Monthly target conquered', body: 'A whole month of getting things done. Brilliant work!' },
  yearly: { emoji: '🥇', title: 'Yearly target achieved', body: "You've hit your yearly target. What a year!" },
};

// Shows the head of the queue as a macOS-style banner until the user closes it or it times out, then calls onShown to drop it
const TargetBanner = ({ queue, onShown }) => {
  const current = queue[0];
  const [dismissed, setDismissed] = useState(null);
  const phase = dismissed === current ? 'out' : 'in';

  // Depends on dismissed as well as current so the timer restarts when two banners of the same type are queued back to back
  useEffect(() => {
    if (!current || dismissed) return;
    const autoTimer = setTimeout(() => setDismissed(current), AUTO_DISMISS_MS);
    return () => clearTimeout(autoTimer);
  }, [current, dismissed]);

  useEffect(() => {
    if (!dismissed) return;
    const doneTimer = setTimeout(() => {
      setDismissed(null);
      onShown();
    }, SLIDE_MS);
    return () => clearTimeout(doneTimer);
  }, [dismissed]);

  if (!current) return null;
  const copy = BANNER_COPY[current];

  return createPortal(
    <div className={`target-banner target-banner-${phase}`}>
      <img className="target-banner-icon" src="/listpal-icon.png" alt="" />
      <div className="target-banner-text">
        <div className="target-banner-title">{copy.title} {copy.emoji}</div>
        <div className="target-banner-body">{copy.body}</div>
      </div>
      <button className="target-banner-close" aria-label="Dismiss" onClick={() => setDismissed(current)}>
        <img src={closeIcon} alt="" />
      </button>
    </div>,
    document.body
  );
};

export default TargetBanner;
