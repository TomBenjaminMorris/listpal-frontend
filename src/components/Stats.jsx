import { memo, useEffect, useState } from 'react';
import { getStats } from '../utils/apiGatewayClient';
import graphIcon from '../assets/icons8-graph-48.png';
import ChartList from './ChartList';
import Loader from './Loader';
import './Stats.css';

const Stats = memo(({ isLoading, setIsLoading, boards }) => {
  const [stats, setStats] = useState([]);
  const [totalTargets, setTotalTargets] = useState(0);

  // Fetch stats and set them
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await getStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total targets from boards
  const calculateTotalTargets = () => {
    if (!boards?.length) return 0;
    return boards.reduce((acc, board) => acc + Number(board.YTarget), 0);
  };

  useEffect(() => {
    document.title = 'ListPal | Stats 📈';
    fetchStats();
    setTotalTargets(calculateTotalTargets());
  }, [boards]);

  const content = (
    <div className="weekly-reports-content-wrapper">
      <div className="weekly-reports-content-sub-wrapper">
        <div className="weekly-report-title-wrapper fadeUp-animation">
          <h2 className="weekly-report-title">Your Stats</h2>
          <img className="heading-icon" src={graphIcon} alt="Graph Icon" />
        </div>
        {stats.length > 0 ? <ChartList stats={stats} totalTargets={totalTargets} /> : "No stats found... Check back here at the end of the week."}
      </div>
    </div>
  );

  return (
    <div className="wrapper">
      {isLoading ? <Loader /> : content}
    </div>
  );
});

Loader.displayName = 'Stats.Loader';
Stats.displayName = 'Stats';

export default Stats;
