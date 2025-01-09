import { memo, useEffect, useState, useMemo } from 'react';
import { VictoryChart, VictoryTheme, VictoryScatter, VictoryAxis, VictoryLabel, VictoryArea } from "victory";

const BurndownChart = memo(({ stats, measurements, fontSize, totalTargets }) => {
  // Memoize the cumulative data to avoid recalculation on every render
  const data = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const cumulativeData = stats
      .filter(stat => stat.YearNum === currentYear)
      .sort((a, b) => a.WOTY - b.WOTY)
      .reduce((acc, stat) => {
        const lastTotal = acc[acc.length - 1].actualScore;
        const newTotal = lastTotal + stat.Score;
        return [...acc, {
          x: stat.WOTY,
          actualScore: newTotal,
          remaining: totalTargets - newTotal
        }];
      }, [{ x: 0, actualScore: 0, remaining: totalTargets }]);

    return cumulativeData;
  }, [stats, totalTargets]);

  // Common style for labels and axis
  const labelStyle = {
    fontSize: fontSize,
    fill: "var(--text-colour)",
    fontFamily: "CircularMedium",
  };

  const axisStyle = {
    axis: {
      stroke: "var(--text-colour)",
      strokeWidth: 3,
    },
    ticks: {
      stroke: "var(--text-colour)",
      size: 8,
    },
    tickLabels: {
      ...labelStyle,
      fontWeight: "bold",
    },
  };

  // Calculate dynamic tick values for the x-axis based on data
  const tickValues = data.map(d => d.x);

  return (
    <VictoryChart width={measurements.width} height={measurements.height} theme={VictoryTheme.clean}>

      <VictoryArea
        data={data}
        x="x"
        y="remaining"
        style={{
          data: {
            fill: "var(--accent)",
            fillOpacity: 0.3,
            stroke: "var(--accent)",
            strokeWidth: 3,
            strokeOpacity: 1,
          },
        }}
      />

      <VictoryScatter
        data={data}
        x="x"
        y="remaining"
        size={5}
        style={{
          data: {
            fill: "var(--accent)",
          },
          labels: {
            ...labelStyle,
          },
        }}
        labels={({ datum }) => Math.round(datum.remaining)}
      />

      <VictoryAxis
        style={axisStyle}
        tickValues={tickValues}
        tickFormat={(tick) => Math.round(tick)}
      />

      <VictoryAxis
        dependentAxis
        style={axisStyle}
        domain={[0, totalTargets]}
        tickFormat={(tick) => Math.round(tick)}
      />

      <VictoryLabel
        text="Week"
        x={measurements.width / 2}
        y={measurements.height - 15}
        textAnchor="middle"
        style={labelStyle}
      />

      <VictoryLabel
        text="Remaining Points"
        x={5}
        y={measurements.height / 2}
        textAnchor="middle"
        angle={-90}
        style={labelStyle}
      />

    </VictoryChart>
  );
});

export default BurndownChart;
