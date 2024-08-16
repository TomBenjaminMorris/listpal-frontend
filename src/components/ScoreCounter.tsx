import { buildStyles, CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Link } from 'react-router-dom';
import './ScoreCounter.css'

const ScoreCounter = ({ score, percent }) => {
  // console.log("rendering: ScoreCounter")

  return (
    <Link className="score-button" to="/stats" >
      <div style={{ width: 70, height: 70 }}>
        <CircularProgressbarWithChildren value={percent} styles={buildStyles({
          trailColor: 'var(--white)',
          textColor: 'var(--white)',
          pathColor: `var(--red-faded)`,
          pathTransitionDuration: 1,
        })}>
          <div style={{ fontSize: 18, marginTop: -1 }}>
            <strong>{score}</strong>
          </div>
        </CircularProgressbarWithChildren>
      </div>
    </Link>
  );
};

export default ScoreCounter;
