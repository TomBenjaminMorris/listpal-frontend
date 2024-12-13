import { CSSProperties, useEffect, useState } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { getReports } from '../utils/apiGatewayClient';
import aiIcon from '../assets/icons8-ai-96.png';
import './WeeklyReports.css';

const override: CSSProperties = {
  paddingTop: '50px',
  opacity: '0.8',
};

const WeeklyReports = ({ sidebarIsOpen, isLoading, setIsLoading }) => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        document.title = 'ListPal | Weekly Reports';
        const response = await getReports();
        const formattedReports = response
          .map(({ SK, Score, Summary, WOTY }) => {
            const parsedSummary = JSON.parse(Summary);
            return { SK, Score, Summary: parsedSummary.summaries, WOTY };
          })
          .sort((a, b) => b.WOTY - a.WOTY);
        setReports(formattedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [setIsLoading]);

  const renderReports = reports.map(({ SK, Score, Summary, WOTY }) => (
    <div className="weekly-report-card-wrapper" key={SK}>
      <div style={{ display: "flex", gap: "10px" }}>
        <h2 className="weekly-report-h2">🗓️</h2>
        <h2 className="weekly-report-h2">Week {WOTY}</h2>
      </div>
      <h3>Tasks Completed: ✨ {Score} ✨</h3>
      {Summary.map(({ category, summary }) => (
        <div key={category}>
          <h4>{category}</h4>
          <p>{summary}</p>
        </div>
      ))}
    </div>
  ));

  const loader = (
    <div className={`loadingWrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
      <PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )

  const content = (
    <div className={`weekly-reports-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
      <div className="weekly-reports-content-sub-wrapper fadeUp-animation">
        <div className="weekly-report-title-wrapper">
          <h2 className="weekly-report-title">AI Weekly Reports</h2>
          <img src={aiIcon} />
        </div>
        {renderReports}
      </div>
    </div>
  );

  return <div className="wrapper">{isLoading ? loader : content}</div>;
};

export default WeeklyReports;
