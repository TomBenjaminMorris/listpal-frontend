import { memo, useEffect, useState, useCallback } from 'react';
import { getReports } from '../utils/apiGatewayClient';
import PulseLoader from 'react-spinners/PulseLoader';
import aiIcon from '../assets/icons8-ai-96.png';
import './WeeklyRoundups.css';

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

const ReportSummary = memo(({ category, summary }) => (
  <div>
    <h4>{category}</h4>
    <p>{summary}</p>
  </div>
));

const WeeklyReport = memo(({ SK, Score, Summary, WOTY }) => (
  <div className="weekly-report-card-wrapper" key={SK}>
    <div style={{ display: "flex", gap: "10px" }}>
      <h2 className="weekly-report-h2">🗓️</h2>
      <h2 className="weekly-report-h2">Week {WOTY}</h2>
    </div>
    <h3>Tasks Completed: ✨ {Score} ✨</h3>
    {Summary.map(summary => (
      <ReportSummary
        key={summary.category}
        category={summary.category}
        summary={summary.summary}
      />
    ))}
  </div>
));

const WeeklyRoundups = memo(({ sidebarIsOpen, isLoading, setIsLoading }) => {
  const [reports, setReports] = useState([]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getReports();
      const formattedReports = response
        .map(({ SK, Score, Summary, WOTY, YearNum }) => ({
          SK,
          Score,
          Summary: JSON.parse(Summary).summaries,
          WOTY,
          YearNum
        }))
        .sort((a, b) => b.YearNum - a.YearNum || b.WOTY - a.WOTY);
      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  useEffect(() => {
    document.title = 'ListPal | Weekly Roundups 🗓️';
    fetchReports();
  }, [fetchReports]);

  const content = (
    <div className={`weekly-reports-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
      <div className="weekly-reports-content-sub-wrapper fadeUp-animation">
        <div className="weekly-report-title-wrapper">
          <h2 className="weekly-report-title">AI Weekly Roundups</h2>
          <img src={aiIcon} alt="AI Icon" />
        </div>
        {reports.length > 0 ? reports.map(report => (
          <WeeklyReport key={report.SK} {...report} />
        )) : "No roundups found... Check back here at the end of the week."}
      </div>
    </div>
  );

  return (
    <div className="wrapper">
      {isLoading ? <Loader sidebarIsOpen={sidebarIsOpen} /> : content}
    </div>
  );
});

Loader.displayName = 'WeeklyRoundups.Loader';
ReportSummary.displayName = 'WeeklyRoundups.ReportSummary';
WeeklyReport.displayName = 'WeeklyRoundups.WeeklyReport';
WeeklyRoundups.displayName = 'WeeklyRoundups';

export default WeeklyRoundups;