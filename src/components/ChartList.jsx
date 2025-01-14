import { memo } from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import BurndownChart from './BurndownChart';
import './ChartList.css';

const ChartList = ({ stats, totalTargets }) => {

  const measurements = { width: 600, height: 350 }
  const fontSize = "14px"
  const charts = [
    { Component: LineChart, title: "Aggregate Score by Week", key: 'aggScoreByWeek' },
    { Component: BarChart, title: "Score by Week", key: 'scoreByWeek' },
    { Component: BurndownChart, title: "Yearly Burndown", key: 'burndownYear' },
    // { Component: BarChart, title: "Score by Week", key: 'bar' },
  ];

  return (
    <div className="chart-list-wrapper">
      {charts.map(({ Component, key, title }) => (
        <div key={key} className="chart-list-inner-wrapper fadeUp-animation" style={{ maxHeight: measurements.height }}>
          <div className="chart-list-title">{title}</div>
          <Component stats={stats} measurements={measurements} fontSize={fontSize} totalTargets={totalTargets} />
        </div>
      ))}
    </div>
  );
};

export default memo(ChartList);
