import { useState, useEffect, useRef, memo } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { updateBoardScoresAPI } from '../utils/apiGatewayClient';
import { useOnClickOutside } from 'usehooks-ts';
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

const ScoreCounter = memo(({ score, percent, type, currentBoardScores, setBoards, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
  const [scoreValue, setScoreValue] = useState(score);
  const [animate, setAnimate] = useState(true);
  const [scoreHasChanged, setScoreHasChanged] = useState(false);
  const scoreRef = useRef(null);
  const prevRef = useRef({ boardSK: undefined, percent: undefined });

  const validateAndUpdateScore = async () => {
    if (scoreValue < 0) {
      setAlertConf({
        display: true,
        animate: true,
        title: "Error 💀",
        textValue: "Score can't be less than 0.",
      });
      return false;
    }
    if (scoreValue === "") {
      setAlertConf({
        display: true,
        animate: true,
        title: "Error 💀",
        textValue: "Score can't be empty.",
      });
      return false;
    }
    return true;
  };

  const handleScoreUpdate = async () => {
    if (!scoreHasChanged || !(await validateAndUpdateScore())) return;

    const updatedScores = {
      ...currentBoardScores,
      [TYPE_MAPPINGS[type].detail]: scoreValue
    };

    try {
      await updateBoardScoresAPI(currentBoardScores.SK, {
        YScore: updatedScores.YScore,
        MScore: updatedScores.MScore,
        WScore: updatedScores.WScore
      });

      setBoards(boards =>
        boards.map(board =>
          board.SK === currentBoardScores.SK ? updatedScores : board
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
    // Loading a board that is already at or above target (or switching to one) must stay silent.
    const prev = prevRef.current;
    const crossedTarget = !!boardSK && prev.boardSK === boardSK && prev.percent < 100 && percent >= 100;
    prevRef.current = { boardSK, percent };
    if (percent >= 100) {
      if (crossedTarget) setFlag(setIsTargetMet, label, false);
      setFlag(setIsExploding, label, true);
    } else if (percent !== undefined && percent !== null) {
      setFlag(setIsExploding, label, false);
    }
  }, [percent, score, currentBoardScores?.SK])

  useOnClickOutside(scoreRef, handleScoreUpdate);

  const progressBarStyles = buildStyles({
    trailColor: 'var(--text-colour)',
    textColor: 'var(--text-colour)',
    pathColor: isExploding[TYPE_MAPPINGS[type].label] ? 'var(--accent-2)' : 'var(--accent)',
    pathTransitionDuration: 1,
  });

  return (
    <div className={`score-button ${animate ? "bulge-now" : ""}`} onAnimationEnd={() => setAnimate(false)} ref={scoreRef}>
      <div style={{ width: 45, height: 45 }}>
        {(percent || percent >= 0) && (
          <CircularProgressbarWithChildren value={percent} styles={progressBarStyles}>
            <div style={{ fontSize: 15, marginTop: 0 }}>
              <input className="score-input" type="text" value={scoreValue} onChange={e => {
                setScoreValue(e.target.value);
                setScoreHasChanged(true);
              }} />
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
