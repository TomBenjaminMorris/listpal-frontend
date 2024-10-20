import { useState, useEffect } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { updateBoardScoresAPI } from '../utils/apiGatewayClient';
import ConfettiExplosion from 'react-confetti-explosion';
import starIcon from '../assets/icons8-star-50.png';
import 'react-circular-progressbar/dist/styles.css';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent, type, currentBoard, setBoards }) => {
  // console.log("rendering: ScoreCounter")
  const [scoreValue, setScoreValue] = useState(score);
  const [animate, setAnimate] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const [isTargetMet, setIsTargetMet] = useState(true);
  const [timer, setTimer] = useState(null);

  const listClassName = `score-button ${animate ? "bulge-now" : ""}`
  const vw = window.innerWidth * 1;
  const typeToUserDetailMap = { "W": "WScore", "M": "MScore", "Y": "YScore" }

  const handleConfettiCompleted = () => {
    // alert(`You've hit your ${typeToMessageMap[type]} target... keep going!`);
    setIsTargetMet(true);
  }

  const handleScoreUpdate = e => {
    setScoreValue(e.target.value);
    clearTimeout(timer);
    const newTimer = setTimeout(() => {
      const tmpBoardDetails = { ...currentBoard };
      tmpBoardDetails[typeToUserDetailMap[type]] = e.target.value;
      updateBoardScoresAPI(currentBoard.SK, { YScore: tmpBoardDetails["YScore"], MScore: tmpBoardDetails["MScore"], WScore: tmpBoardDetails["WScore"] }).then(() => {
        setBoards(current => {
          return current.map((c) => {
            if (c.SK === currentBoard.SK) {
              return tmpBoardDetails
            } else {
              return c
            }
          });
        });
      })
    }, 500);
    setTimer(newTimer);
  }

  useEffect(() => {
    setScoreValue(score)
    setAnimate(true);
    if (score && percent) {
      if (percent >= 100) {
        setIsExploding(true)
      } else {
        setIsExploding(false);
        setIsTargetMet(false);
      }
    }
  }, [percent, score])

  const starImg = (
    <img className="star-icon" src={starIcon} alt="star icon" />
  )

  return (
    <div className={listClassName} onAnimationEnd={() => setAnimate(false)}>
      {isExploding && !isTargetMet && <ConfettiExplosion zIndex={1000} duration={3000} width={vw} particleSize={15} particleCount={80} onComplete={handleConfettiCompleted} />}
      <div style={{ width: 50, height: 50 }}
      >
        <CircularProgressbarWithChildren value={percent} styles={buildStyles({
          trailColor: 'var(--text-colour)',
          textColor: 'var(--text-colour)',
          pathColor: `${isExploding ? "var(--accent-2)" : "var(--accent)"}`,
          pathTransitionDuration: 1,
        })}>
          <div style={{ fontSize: 15, marginTop: 0 }}>
            <input className="score-input" type="text" value={scoreValue} onChange={e => handleScoreUpdate(e)} />
            {isExploding ? starImg : null}
          </div>
        </CircularProgressbarWithChildren>
        <div className="score-type-tooltip">{type}</div>
      </div>
    </div>
  );
};

export default ScoreCounter;
