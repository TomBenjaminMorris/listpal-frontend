import { memo, useEffect, useState } from 'react';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryScatter, VictoryAxis, VictoryLabel, VictoryArea } from "victory";
import './LineChart.css';

const LineChart = ({ stats, measurements, fontSize }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const cumulativeData = stats
      .filter(stat => stat.YearNum === currentYear)
      .sort((a, b) => a.WOTY - b.WOTY)
      .reduce((acc, stat) => {
        const lastTotal = acc[acc.length - 1].y;
        return [...acc, {
          x: stat.WOTY,
          y: lastTotal + stat.Score
        }];
      }, [{ x: 0, y: 0 }]);
    setData(cumulativeData);
  }, [stats]);

  return (
    <VictoryChart width={measurements.width} height={measurements.height} theme={VictoryTheme.clean}>

      <VictoryArea
        data={data}
        interpolation="natural"
        style={{
          data: {
            fill: "var(--accent)",
            opacity: 0.25,
          },
        }}
      />

      <VictoryLine
        interpolation="natural"
        data={data}
        style={{
          data: {
            stroke: "var(--accent)",
            strokeWidth: 2,
          },
        }}
      />

      <VictoryScatter
        data={data}
        size={5}
        style={{
          data: {
            fill: "var(--accent)",
          },
          labels: {
            fontSize: fontSize,
            fill: "var(--text-colour)",
            fontWeight: "bold",
            fontFamily: "CircularMedium",
          },
        }}
        labels={({ datum }) => datum.y === 0 ? "" : `${datum.y}`}
      />

      <VictoryAxis
        style={{
          axis: {
            stroke: "var(--text-colour)",
            strokeWidth: 3,
          },
          ticks: {
            stroke: "var(--text-colour)",
            size: 8,
          },
          tickLabels: {
            fontSize: fontSize,
            fill: "var(--text-colour)",
            fontWeight: "bold",
            fontFamily: "CircularMedium",
          },
        }}
        tickValues={
          data.length === 2
            ? [0, 1]
            : data.length === 3
              ? [0, 1, 2]
              : data.length === 4
                ? [0, 1, 2, 3]
                : data.map(d => d.x)
        }
        tickFormat={(tick) => Math.round(tick)}
      />

      <VictoryAxis
        dependentAxis
        style={{
          axis: {
            stroke: "var(--text-colour)",
            strokeWidth: 3,
          },
          ticks: {
            stroke: "var(--text-colour)",
            size: 8,
          },
          tickLabels: {
            fontSize: fontSize,
            fill: "var(--text-colour)",
            fontWeight: "bold",
            fontFamily: "CircularMedium",
          },
        }}
        tickFormat={(tick) => Math.round(tick)}
      />

      <VictoryLabel
        text="Week"
        x={measurements.width / 2}
        y={measurements.height - 15}
        textAnchor="middle"
        style={{
          fontSize: fontSize,
          fill: "var(--text-colour)",
          fontWeight: "bold",
          fontFamily: "CircularMedium",
        }}
      />

      <VictoryLabel
        text="Total Score"
        x={10}
        y={measurements.height / 2}
        textAnchor="middle"
        angle={-90}
        style={{
          fontSize: fontSize,
          fill: "var(--text-colour)",
          fontWeight: "bold",
          fontFamily: "CircularMedium",
        }}
      />

    </VictoryChart>
  );
};

export default memo(LineChart);
