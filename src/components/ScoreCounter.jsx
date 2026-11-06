import { useState, useEffect, useRef, memo } from 'react';
import { updateBoardScoresAPI } from '../utils/apiGatewayClient';
import { flushNow, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { applyManualScore, parseScoreInput } from '../utils/utils';
import { StarIcon } from './Icons';
import './ScoreCounter.css';

const TYPE_MAPPINGS = {
  W: { detail: 'WScore', label: 'weekly', name: 'This week' },
  M: { detail: 'MScore', label: 'monthly', name: 'This month' },
  Y: { detail: 'YScore', label: 'yearly', name: 'This year' }
};

// In the SVG's own units. A dash length in CSS px, as react-circular-progressbar used, is scaled by page zoom in
// Safari while the circle is not, which broke the arc up at any zoom other than 100%
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Returning the same object when nothing changes lets React skip re-rendering the whole board
const setFlag = (setter, label, value) => setter(current => current[label] === value ? current : { ...current, [label]: value });

const ScoreCounter = memo(({ score, percent, type, currentBoardScores, refreshCount, setBoards, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
  const [scoreValue, setScoreValue] = useState(score);
  const [animate, setAnimate] = useState(false);
  const [scoreHasChanged, setScoreHasChanged] = useState(false);
  const prevRef = useRef({ boardSK: undefined, percent: undefined, refreshCount });
  const { detail, label, name } = TYPE_MAPPINGS[type];

  const handleScoreUpdate = async () => {
    if (!scoreHasChanged) return;
    if (scoreValue === "") {
      setAlertConf({
        display: true,
        title: "Missing a number 🔢",
        textValue: "The score can't be empty. Pop a number in and try again.",
      });
      return;
    }

    const { SK, YScore, MScore, WScore } = currentBoardScores;
    const scores = applyManualScore({ YScore, MScore, WScore }, detail, scoreValue);

    try {
      // The value typed already counts any tick still queued, and the server sets it outright, so a tick landing
      // after it would add that point again. Send the queue first; if sync is failing, wait at most 3 s as a load does.
      await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
      await updateBoardScoresAPI(SK, scores);

      // An updater over the latest boards, as the flush can take seconds and settings may change meanwhile
      setBoards(boards => boards.map(board => board.SK === SK ? { ...board, ...scores } : board));
      setScoreHasChanged(false);
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  useEffect(() => {
    setScoreValue(score);
    const boardSK = currentBoardScores?.SK;
    // A celebration needs a real crossing: same board, previous percent known and below 100.
    // Loading a board that is already at or above target (or switching to one) must stay silent, and so must a
    // refresh on return bringing in a target met on another device.
    const prev = prevRef.current;
    // Only a change bulges, so opening a board doesn't set every counter pulsing during its entrance
    if (prev.boardSK === boardSK) setAnimate(true);
    const crossedTarget = !!boardSK && prev.boardSK === boardSK && prev.refreshCount === refreshCount && prev.percent < 100 && percent >= 100;
    prevRef.current = { ...prev, boardSK, percent };
    if (percent >= 100) {
      if (crossedTarget) setFlag(setIsTargetMet, label, false);
      setFlag(setIsExploding, label, true);
    } else if (percent !== undefined && percent !== null) {
      setFlag(setIsExploding, label, false);
    }
  }, [percent, score, currentBoardScores?.SK]);

  // After the effect above, so it sees a refresh that arrived with the new score as different. Not one of its
  // dependencies, because a refresh that changes nothing mustn't bulge the counter.
  useEffect(() => {
    prevRef.current.refreshCount = refreshCount;
  }, [refreshCount]);

  const target = currentBoardScores?.[`${type}Target`];

  return (
    <div className={`score-button ${animate ? "bulge-now" : ""}`} onAnimationEnd={() => setAnimate(false)}>
      <div className="score-ring">
        {(percent || percent >= 0) && (
          <>
            {/* The arc is hidden when empty, as its round cap would still draw a dot */}
            <svg className="score-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="score-ring-trail" cx="50" cy="50" r={RING_RADIUS} />
              <circle className="score-ring-path" cx="50" cy="50" r={RING_RADIUS}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(Math.max(percent, 0), 100) / 100)}
                strokeOpacity={percent > 0 ? 1 : 0} />
            </svg>
            <div className="score-ring-centre">
              <input className="score-input" type="text" inputMode="numeric" value={scoreValue} onChange={e => {
                const parsed = parseScoreInput(e.target.value);
                if (parsed === null) return;
                setScoreValue(parsed);
                setScoreHasChanged(true);
              }} onBlur={handleScoreUpdate} />
            </div>
          </>
        )}
        {isExploding[label] && <span className="score-star" aria-label="Target met"><StarIcon /></span>}
        <div className="tooltip">{`${name}: ${Number(score).toLocaleString()} of ${Number(target).toLocaleString()}`}</div>
      </div>
    </div>
  );
});

export default ScoreCounter;
