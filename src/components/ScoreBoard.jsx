import { useEffect, useState, memo } from 'react';
import { calcPercents } from '../utils/utils';
import ScoreCounter from './ScoreCounter';
import './ScoreBoard.css';

const ScoreBoard = memo(({ boards, setBoards, boardID, setAlertConf }) => {
  const [percentValues, setPercentValues] = useState({ W: 0, M: 0, Y: 0 });
  const [currentBoardScores, setCurrentBoardScores] = useState({
    WScore: 0,
    MScore: 0,
    YScore: 0,
    WTarget: 0,
    MTarget: 0,
    YTarget: 0,
  });

  // Recalculate percentages when currentBoard changes
  useEffect(() => {
    if (currentBoardScores) {
      const percents = calcPercents(currentBoardScores);
      setPercentValues(percents);
    }
  }, [currentBoardScores, boards])

  // Update current board based on boardID, only when boards or boardID changes
  useEffect(() => {
    const board = boards.find((b) => b.SK === boardID);
    if (board) {
      setCurrentBoardScores(board);
    }
  }, [boards, boardID]);

  return (
    <div className="score-counter-wrapper">
      <ScoreCounter
        score={currentBoardScores?.WScore}
        percent={percentValues.W}
        type="W"
        currentBoardScores={currentBoardScores}
        setBoards={setBoards}
        setAlertConf={setAlertConf}
      />
      <ScoreCounter
        score={currentBoardScores?.MScore}
        percent={percentValues.M}
        type="M"
        currentBoardScores={currentBoardScores}
        setBoards={setBoards}
        setAlertConf={setAlertConf}
      />
      <ScoreCounter
        score={currentBoardScores?.YScore}
        percent={percentValues.Y}
        type="Y"
        currentBoardScores={currentBoardScores}
        setBoards={setBoards}
        setAlertConf={setAlertConf}
      />
    </div>
  );
});

export default ScoreBoard;
