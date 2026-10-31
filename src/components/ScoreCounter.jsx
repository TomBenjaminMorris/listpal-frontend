import { useState, useEffect, useRef, memo } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { updateBoardScoresAPI } from '../utils/apiGatewayClient';
import { flushNow, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { applyManualScore, parseScoreInput } from '../utils/utils';
import starIcon from '../assets/icons8-star-50.png';
import 'react-circular-progressbar/dist/styles.css';
import './ScoreCounter.css';

const TYPE_MAPPINGS = {
  W: { detail: 'WScore', label: 'weekly' },
  M: { detail: 'MScore', label: 'monthly' },
  Y: { detail: 'YScore', label: 'yearly' }
};

// Returning the same object when nothing changes lets React skip re-rendering the whole board
const setFlag = (setter, label, value) => setter(current => current[label] === value ? current : { ...current, [label]: value });

const ScoreCounter = memo(({ score, percent, type, currentBoardScores, refreshCount, setBoards, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
  const [scoreValue, setScoreValue] = useState(score);
  const [animate, setAnimate] = useState(true);
  const [scoreHasChanged, setScoreHasChanged] = useState(false);
  const prevRef = useRef({ boardSK: undefined, percent: undefined, refreshCount });

  const validateAndUpdateScore = async () => {
    if (scoreValue === "") {
      setAlertConf({
        display: true,
        title: "Missing a number 🔢",
        textValue: "The score can't be empty. Pop a number in and try again.",
      });
      return false;
    }
    return true;
  };

  const handleScoreUpdate = async () => {
    if (!scoreHasChanged || !(await validateAndUpdateScore())) return;

    const { SK, YScore, MScore, WScore } = currentBoardScores;
    const scores = applyManualScore({ YScore, MScore, WScore }, TYPE_MAPPINGS[type].detail, scoreValue);

    try {
      // The value typed already counts any tick still queued, and the server sets it outright, so a tick landing
      // after it would add that point again. Send the queue first; if sync is failing, wait at most 3 s as a load does.
      await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
      await updateBoardScoresAPI(SK, scores);

      // An updater over the latest boards, as the flush can take seconds and settings may change meanwhile
      setBoards(boards =>
        boards.map(board =>
          board.SK === SK ? { ...board, ...scores } : board
        )
      );
      setScoreHasChanged(false);
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  useEffect(() => {
    setScoreValue(score)
    setAnimate(true);
    const label = TYPE_MAPPINGS[type].label;
    const boardSK = currentBoardScores?.SK;
    // A celebration needs a real crossing: same board, previous percent known and below 100.
    // Loading a board that is already at or above target (or switching to one) must stay silent, and so must a
    // refresh on return bringing in a target met on another device.
    const prev = prevRef.current;
    const crossedTarget = !!boardSK && prev.boardSK === boardSK && prev.refreshCount === refreshCount && prev.percent < 100 && percent >= 100;
    prevRef.current = { ...prev, boardSK, percent };
    if (percent >= 100) {
      if (crossedTarget) setFlag(setIsTargetMet, label, false);
      setFlag(setIsExploding, label, true);
    } else if (percent !== undefined && percent !== null) {
      setFlag(setIsExploding, label, false);
    }
  }, [percent, score, currentBoardScores?.SK])

  // After the effect above, so it sees a refresh that arrived with the new score as different. Not one of its
  // dependencies, because a refresh that changes nothing mustn't bulge the counter.
  useEffect(() => {
    prevRef.current.refreshCount = refreshCount;
  }, [refreshCount]);

  const progressBarStyles = buildStyles({
    trailColor: 'var(--text-colour)',
    textColor: 'var(--text-colour)',
    pathColor: isExploding[TYPE_MAPPINGS[type].label] ? 'var(--accent-2)' : 'var(--accent)',
    pathTransitionDuration: 0.5,
  });

  return (
    <div className={`score-button ${animate ? "bulge-now" : ""}`} onAnimationEnd={() => setAnimate(false)}>
      <div style={{ width: 45, height: 45 }}>
        {(percent || percent >= 0) && (
          <CircularProgressbarWithChildren value={percent} styles={progressBarStyles}>
            <div style={{ fontSize: 15, marginTop: 0 }}>
              <input className="score-input" type="text" inputMode="numeric" value={scoreValue} onChange={e => {
                const parsed = parseScoreInput(e.target.value);
                if (parsed === null) return;
                setScoreValue(parsed);
                setScoreHasChanged(true);
              }} onBlur={handleScoreUpdate} />
              {isExploding[TYPE_MAPPINGS[type].label] && <img className="star-icon" src={starIcon} alt="star icon" />}
            </div>
          </CircularProgressbarWithChildren>
        )}
        <div className="score-type-tooltip">{type}</div>
      </div>
    </div>
  );
});

export default ScoreCounter;
