import { useState, useEffect } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { updateScoresAPI } from '../utils/apiGatewayClient';
import { Link } from 'react-router-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import starIcon from '../assets/icons8-star-50.png';
import 'react-circular-progressbar/dist/styles.css';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent, type, userDetails, setUserDetails }) => {
  // console.log("rendering: ScoreCounter")
  const [scoreValue, setScoreValue] = useState(score);
  const [showScore, setShowScore] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const [isTargetMet, setIsTargetMet] = useState(true);
  const [timer, setTimer] = useState(null);
  const listClassName = `score-button ${animate ? "bulge-now" : ""}`
  const vw = window.innerWidth * 1;
  // const typeToMessageMap = { "W": "weekly", "M": "monthly", "Y": "yearly" }
  const typeToUserDetailMap = { "W": "WScore", "M": "MScore", "Y": "YScore" }
  // const typeToEmojiMap = { "W": "⭐", "M": "✨", "Y": "💫" }

  const handleConfettiCompleted = () => {
    // alert(`You've hit your ${typeToMessageMap[type]} target... keep going!`);
    setIsTargetMet(true);
  }

  const handleScoreUpdate = e => {
    setScoreValue(e.target.value);
    clearTimeout(timer);
    const newTimer = setTimeout(() => {
      const tmpUserDetails = { ...userDetails };
      tmpUserDetails[typeToUserDetailMap[type]] = e.target.value;
      updateScoresAPI({ YScore: tmpUserDetails["YScore"], MScore: tmpUserDetails["MScore"], WScore: tmpUserDetails["WScore"] }).then(() => {
        setUserDetails(tmpUserDetails);
      })
      // console.log(e.target.value);
    }, 3000);
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
    // <div style={{fontSize: "20px"}}>{typeToEmojiMap[type]}</div>
  )

  const scoreRendered = (
    // <strong>
      isExploding ? starImg : <input className="score-input" type="number" value={scoreValue} onChange={e => handleScoreUpdate(e)} />
    // </strong>
  )

  return (
    <div className={listClassName} onAnimationEnd={() => setAnimate(false)}>
      {isExploding && !isTargetMet && <ConfettiExplosion zIndex={1000} duration={3000} width={vw} particleSize={15} particleCount={80} onComplete={handleConfettiCompleted} />}
      <div
        style={{ width: 50, height: 50 }}
        onMouseEnter={isExploding ? () => setShowScore(true) : null}
        onMouseLeave={isExploding ? () => setShowScore(false) : null}
      >
        <CircularProgressbarWithChildren value={percent} styles={buildStyles({
          trailColor: 'var(--text-colour)',
          textColor: 'var(--text-colour)',
          pathColor: `${isExploding ? "var(--accent-2)" : "var(--accent)"}`,
          pathTransitionDuration: 1,
        })}>
          <div style={{ fontSize: 15, marginTop: 0 }}>
            <input className="score-input" type="number" value={scoreValue} onChange={e => handleScoreUpdate(e)} />
            {/* {showScore ? score : scoreRendered} */}
          </div>
        </CircularProgressbarWithChildren>
      </div>
    </div>
  );
};

export default ScoreCounter;
