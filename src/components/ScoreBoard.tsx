import { useEffect, useState } from 'react';
import { calcPercents } from '../utils/utils';
import ScoreCounter from './ScoreCounter';

const ScoreBoard = ({ boards, setBoards, boardID }) => {
  // console.log("rendering: ScoreBoard")
  const [percentValues, setPercentValues] = useState({ W: 0, M: 0, Y: 0 });
  const [currentBoard, setCurrentBoard] = useState({ WScore: 0, MScore: 0, YScore: 0, WTarget: 0, MTarget: 0, YTarget: 0 });

  useEffect(() => {
    if (Object.keys(currentBoard).length != 0) {
      const percents = calcPercents(currentBoard);
      setPercentValues(percents);
    }
  }, [currentBoard])

  useEffect(() => {
    setCurrentBoard(boards.filter((b) => b.SK == boardID)[0])
  }, [boards, boardID])

  return (
    <>
      <ScoreCounter score={currentBoard && currentBoard.WScore} percent={percentValues.W} type="W" currentBoard={currentBoard} setBoards={setBoards} />
      <ScoreCounter score={currentBoard && currentBoard.MScore} percent={percentValues.M} type="M" currentBoard={currentBoard} setBoards={setBoards} />
      <ScoreCounter score={currentBoard && currentBoard.YScore} percent={percentValues.Y} type="Y" currentBoard={currentBoard} setBoards={setBoards} />
    </>
  );
};

export default ScoreBoard;
