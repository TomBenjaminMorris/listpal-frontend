import { useEffect, useState, memo } from 'react';
import { calcPercents } from '../utils/utils';
import ScoreCounter from './ScoreCounter';
import './ScoreBoard.css';

const ScoreBoard = memo(({ boards, setBoards, boardID, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
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

  // Define the score counters for weekly/monthly/yearly
  const renderScoreCounter = (type, score, percent) => (
    <ScoreCounter
      score={score}
      percent={percent}
      type={type}
      currentBoardScores={currentBoardScores}
      setBoards={setBoards}
      setAlertConf={setAlertConf}
      setIsExploding={setIsExploding}
      setIsTargetMet={setIsTargetMet}
      isExploding={isExploding}
    />
  );

  return (
    <div className="score-counter-wrapper">
      {['W', 'M', 'Y'].map((type) => renderScoreCounter(type, currentBoardScores?.[`${type}Score`], percentValues[type]))}
    </div>
  );
});

export default ScoreBoard;
