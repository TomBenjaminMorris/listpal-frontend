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

const ScoreCounter = memo(({ score, percent, type, currentBoardScores, setBoards, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
  const [scoreValue, setScoreValue] = useState(score);
  const [animate, setAnimate] = useState(true);
  const [scoreHasChanged, setScoreHasChanged] = useState(false);
  const scoreRef = useRef(null);

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
    if (score && percent) {
      if (percent >= 100) {
        setIsExploding(current => ({
          ...current,
          [TYPE_MAPPINGS[type].label]: true,
        }));
      } else {
        setIsExploding(current => ({
          ...current,
          [TYPE_MAPPINGS[type].label]: false,
        }));
        setIsTargetMet(current => ({
          ...current,
          [TYPE_MAPPINGS[type].label]: false,
        }));
      }
    }
  }, [percent, score])

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
