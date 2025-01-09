import { memo } from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import BurndownChart from './BurndownChart';
import './ChartList.css';

const ChartList = ({ stats, totalTargets }) => {

  // const measurements = { width: 500, height: 350 }
  const fontSize = "14px"
  const charts = [
    { Component: LineChart, title: "Aggregate Score by Week", key: 'line', measurements: { width: 800, height: 300 } },
    { Component: BarChart, title: "Score by Week", key: 'bar', measurements: { width: 800, height: 300 } },
    { Component: BurndownChart, title: "Yearly Burndown", key: 'gauge', measurements: { width: 800, height: 300 } },
  ];

  return (
    <div className="chart-list-wrapper">
      {charts.map(({ Component, key, measurements, title }) => (
        <div key={key} className="chart-list-inner-wrapper fadeUp-animation" style={{ maxWidth: measurements.width }}>
          <div className="chart-list-title">{title}</div>
          <Component stats={stats} measurements={measurements} fontSize={fontSize} totalTargets={totalTargets} />
        </div>
      ))}
    </div>
  );
};

export default memo(ChartList);
