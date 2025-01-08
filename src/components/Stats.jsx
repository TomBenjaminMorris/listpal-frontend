import { memo, useEffect, useState, useCallback } from 'react';
import { getStats } from '../utils/apiGatewayClient';
import PulseLoader from 'react-spinners/PulseLoader';
import graphIcon from '../assets/icons8-graph-48.png';
import LineChart from './LineChart';
import './Stats.css';

const LOADER_STYLE = {
  paddingTop: '50px',
  opacity: '0.8',
};

const Loader = memo(({ sidebarIsOpen }) => (
  <div className={`loadingWrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
    <PulseLoader
      cssOverride={LOADER_STYLE}
      size={12}
      color="var(--text-colour)"
      speedMultiplier={1}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
));

const Stats = memo(({ sidebarIsOpen, isLoading, setIsLoading }) => {
  const [stats, setStats] = useState([]);
  const [formattedStats, setFormattedStats] = useState([]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await getStats();
      const currentYear = new Date().getFullYear();

      const aggregatedStats = response
        .sort((a, b) => a.WOTY - b.WOTY)
        .reduce((acc, stat) => {
          if (stat.YearNum !== currentYear) {
            return acc;
          }
          const lastEntry = acc[acc.length - 1];
          const totalScore = (lastEntry?.y || 0) + stat.Score;
          acc.push({ x: stat.WOTY, y: totalScore });
          return acc;
        }, [{ x: 0, y: 0 }]);

      setStats(response);
      setFormattedStats(aggregatedStats)
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'ListPal | Stats 📈';
    fetchStats();
  }, []);

  const content = (
    <div className={`weekly-reports-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
      <div className="weekly-reports-content-sub-wrapper fadeUp-animation">
        <div className="weekly-report-title-wrapper">
          <h2 className="weekly-report-title">Stats</h2>
          <img src={graphIcon} alt="Graph Icon" />
        </div>
        {stats.length > 0 ? <LineChart data={formattedStats} /> : "No stats found... Check back here at the end of the week."}
      </div>
    </div>
  );

  return (
    <div className="wrapper">
      {isLoading ? <Loader sidebarIsOpen={sidebarIsOpen} /> : content}
    </div>
  );
});

Loader.displayName = 'Stats.Loader';
Stats.displayName = 'Stats';

export default Stats;
