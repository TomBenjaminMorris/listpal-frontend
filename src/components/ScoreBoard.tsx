import { useEffect, useState } from 'react';
import { calcPercents } from '../utils/utils';
import ScoreCounter from './ScoreCounter';

const ScoreBoard = ({ userDetails, setUserDetails }) => {
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
      <ScoreCounter score={userDetails.WScore} percent={percentValues.W} type="W" userDetails={userDetails} setUserDetails={setUserDetails} />
      <ScoreCounter score={userDetails.MScore} percent={percentValues.M} type="M" userDetails={userDetails} setUserDetails={setUserDetails} />
      <ScoreCounter score={userDetails.YScore} percent={percentValues.Y} type="Y" userDetails={userDetails} setUserDetails={setUserDetails} />
    </>
  );
};

export default ScoreBoard;
