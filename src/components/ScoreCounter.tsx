import { useState, useEffect } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Link } from 'react-router-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import starIcon from '../assets/icons8-star-50.png';
import 'react-circular-progressbar/dist/styles.css';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent, type }) => {
  // console.log("rendering: ScoreCounter")
  const [showScore, setShowScore] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const [isTargetMet, setIsTargetMet] = useState(true);
  const listClassName = `score-button ${animate ? "bulge-now" : ""}`
  const vw = window.innerWidth * 1;
  const typeToMessageMap = { "W": "weekly", "M": "monthly", "Y": "yearly" }
  // const typeToEmojiMap = { "W": "⭐", "M": "✨", "Y": "💫" }

  const handleConfettiCompleted = () => {
    alert(`You've hit your ${typeToMessageMap[type]} target... keep going!`);
    setIsTargetMet(true);
  }

  useEffect(() => {
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
    <strong>
      {isExploding ? starImg : score}
    </strong>
  )

  return (
    <Link className={listClassName} onAnimationEnd={() => setAnimate(false)} to="/settings" >
      {isExploding && !isTargetMet && <ConfettiExplosion duration={3000} width={vw} particleSize={15} particleCount={80} onComplete={handleConfettiCompleted} />}
      <div
        style={{ width: 60, height: 60 }}
        onMouseEnter={() => setShowScore(true)}
        onMouseLeave={() => setShowScore(false)}
      >
        <CircularProgressbarWithChildren value={percent} styles={buildStyles({
          trailColor: 'var(--white)',
          textColor: 'var(--white)',
          pathColor: `var(--red-faded)`,
          pathTransitionDuration: 1,
        })}>
          <div style={{ fontSize: 16, marginTop: -1 }}>
            {showScore ? score : scoreRendered}
          </div>
        </CircularProgressbarWithChildren>
      </div>
    </Link>
  );
};

export default ScoreCounter;
