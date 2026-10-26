import { useMemo, memo } from 'react';
import { calcPercents } from '../utils/utils';
import ScoreCounter from './ScoreCounter';
import './ScoreBoard.css';

// Module level so the fallback keeps its identity and doesn't re-run the counters' effects
const EMPTY_SCORES = { WScore: 0, MScore: 0, YScore: 0, WTarget: 0, MTarget: 0, YTarget: 0 };

const ScoreBoard = memo(({ boards, setBoards, boardID, setAlertConf, setIsExploding, setIsTargetMet, isExploding }) => {
  const currentBoardScores = useMemo(() => boards.find(b => b.SK === boardID) ?? EMPTY_SCORES, [boards, boardID]);

  // Derived in the same render as the scores (not in an effect), so a score and its percent never disagree
  const percentValues = useMemo(
    () => currentBoardScores.SK ? calcPercents(currentBoardScores) : { W: 0, M: 0, Y: 0 },
    [currentBoardScores]
  );

  // Define the score counters for weekly/monthly/yearly
  const renderScoreCounter = (type, score, percent) => (
    <ScoreCounter
      key={type}
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
