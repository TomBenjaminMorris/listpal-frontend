import { useState } from 'react';
import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Link } from 'react-router-dom';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent, type }) => {
  // console.log("rendering: ScoreCounter")
  const [showType, setShowType] = useState(false);

  return (
    <Link className="score-button" to="/stats" >
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
