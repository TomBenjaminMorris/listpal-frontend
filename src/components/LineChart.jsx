import { memo } from 'react';
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryScatter,
  VictoryAxis,
  VictoryLabel,
  VictoryArea
} from "victory";

const LineChart = memo(({ data }) => {
  const measurements = { width: window.innerWidth * 0.6, height: 350 };
  const fontSize = "12px";
  data = [
    { x: 0, y: 0 },
    { x: 1, y: 5 },
    { x: 2, y: 10 },
    { x: 3, y: 20 },
    { x: 4, y: 21 },
    { x: 5, y: 28 },
    { x: 6, y: 35 },
    { x: 7, y: 40 },
    { x: 8, y: 45 },
    { x: 9, y: 50 },
    { x: 10, y: 60 },
    { x: 11, y: 60 },
    { x: 12, y: 67 },
  ];

  return (
    <div style={{ maxWidth: 1000, width: "70%", margin: "auto" }}>
      <VictoryChart width={measurements.width} height={measurements.height} theme={VictoryTheme.clean}>

        <VictoryLabel
          text="Aggregate Score by Week"
          x={measurements.width / 2}
          y={20}
          textAnchor="middle"
          style={{
            fontSize: 16,
            fill: "var(--text-colour)",
            fontWeight: "bold",
            fontFamily: "CircularMedium",
          }}
        />

        <VictoryArea
          data={data}
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
    </div>
  );
});

export default LineChart;
