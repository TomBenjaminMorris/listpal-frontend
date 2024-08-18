import { useState, useEffect } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Link } from 'react-router-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import 'react-circular-progressbar/dist/styles.css';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent, type }) => {
  // console.log("rendering: ScoreCounter")
  const [showType, setShowType] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const [isTargetMet, setIsTargetMet] = useState(true);
  const listClassName = `score-button ${animate ? "bulge-now" : ""}`
  const vw = window.innerWidth * 1;
  const typeToMessageMap = {
    "W": "weekly",
    "M": "monthly",
    "Y": "yearly",
  }

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
  }, [percent])

  return (
    <Link className={listClassName} onAnimationEnd={() => setAnimate(false)} to="/stats" >
      {isExploding && !isTargetMet && <ConfettiExplosion duration={3000} width={vw} particleSize={15} particleCount={80} onComplete={handleConfettiCompleted} />}
      <div
        style={{ width: 60, height: 60 }}
        onMouseEnter={() => setShowType(true)}
        onMouseLeave={() => setShowType(false)}
      >
        <CircularProgressbarWithChildren value={percent} styles={buildStyles({
          trailColor: 'var(--white)',
          textColor: 'var(--white)',
          pathColor: `var(--red-faded)`,
          pathTransitionDuration: 1,
        })}>
          <div style={{ fontSize: 16, marginTop: -1 }}>
            <strong>{showType ? type : score}</strong>
          </div>
        </CircularProgressbarWithChildren>
      </div>
    </Link>
  );
};

export default ScoreCounter;
