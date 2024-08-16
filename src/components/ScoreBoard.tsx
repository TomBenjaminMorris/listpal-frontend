import ScoreCounter from './ScoreCounter';

const ScoreBoard = ({}) => {
  // console.log("rendering: ScoreBoard")

  return (
    <>
      <ScoreCounter score={8} percent={80} />
      <ScoreCounter score={43} percent={60} />
      <ScoreCounter score={101} percent={20} />
    </>
  );
};

export default ScoreBoard;
