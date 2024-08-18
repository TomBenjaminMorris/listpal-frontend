import { useEffect, useState } from 'react';
import ScoreCounter from './ScoreCounter';
import { calcPercents } from '../utils/utils';

const ScoreBoard = ({ userDetails }) => {
  // console.log("rendering: ScoreBoard")
  const [percentValues, setPercentValues] = useState({ W: 0, M: 0, Y: 0 });

  useEffect(() => {
    if (Object.keys(userDetails).length != 0) {
      const percents = calcPercents(userDetails);
      setPercentValues(percents);
    }
  }, [userDetails])

  return (
    <>
      {/* <ScoreCounter score={userDetails.WScore} percent={percentValues.W} type="W"/>
      <ScoreCounter score={userDetails.MScore} percent={percentValues.M} type="M"/> */}
      <ScoreCounter score={userDetails.YScore} percent={percentValues.Y} type="Y" />
    </>
  );
};

export default ScoreBoard;
