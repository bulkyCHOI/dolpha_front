/**
 * 전략별 승률·손익 비교 차트
 * - trading-summary-data의 strategy_type을 기준으로 그룹핑해 전략 간 성과 편차를 보여준다.
 */

import { useMemo } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { BarPlot } from "@mui/x-charts/BarChart";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ResponsiveChartContainer } from "@mui/x-charts/ResponsiveChartContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsLegend } from "@mui/x-charts/ChartsLegend";

import EnhancedDataTable from "components/EnhancedDataTable";
import { COLORS } from "constants/styles";

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";

const formatCurrency = (value) => new Intl.NumberFormat("ko-KR").format(Math.round(value));

/** trading-summary-data 원본 배열을 strategy_type 기준으로 집계한다. */
function buildStrategyStats(tradingReviews) {
  const buckets = new Map();

  tradingReviews.forEach((item) => {
    const key = item.strategy_type || "unknown";
    const label = item.strategy_label || "미분류";
    if (!buckets.has(key)) {
      buckets.set(key, {
        strategy_type: key,
        strategy_label: label,
        total_count: 0,
        closed_count: 0,
        profitable_count: 0,
        total_profit_loss: 0,
        winPercents: [],
        lossPercents: [],
      });
    }
    const bucket = buckets.get(key);
    bucket.total_count += 1;
    bucket.total_profit_loss += item.total_profit_loss || 0;
    if (item.final_status === "CLOSED") {
      bucket.closed_count += 1;
      const pct = item.profit_loss_percent;
      if ((item.total_profit_loss || 0) > 0) {
        bucket.profitable_count += 1;
        if (typeof pct === "number") bucket.winPercents.push(pct);
      } else if ((item.total_profit_loss || 0) < 0) {
        if (typeof pct === "number") bucket.lossPercents.push(pct);
      }
    }
  });

  const average = (arr) => (arr.length > 0 ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0);

  return Array.from(buckets.values())
    .map((bucket) => {
      const avgWinPercent = average(bucket.winPercents);
      const avgLossPercent = average(bucket.lossPercents);
      return {
        ...bucket,
        win_rate:
          bucket.closed_count > 0 ? (bucket.profitable_count / bucket.closed_count) * 100 : 0,
        avg_profit_loss: bucket.total_count > 0 ? bucket.total_profit_loss / bucket.total_count : 0,
        avg_win_percent: avgWinPercent,
        avg_loss_percent: avgLossPercent,
        payoff_ratio: avgLossPercent !== 0 ? avgWinPercent / Math.abs(avgLossPercent) : null,
      };
    })
    .sort((a, b) => b.total_profit_loss - a.total_profit_loss);
}

function StrategyBreakdownChart({ tradingReviews }) {
  const strategyStats = useMemo(() => buildStrategyStats(tradingReviews), [tradingReviews]);
  const overall = useMemo(() => {
    const [all] = buildStrategyStats(
      tradingReviews.map((item) => ({ ...item, strategy_type: "__all__" }))
    );
    return all;
  }, [tradingReviews]);

  if (strategyStats.length < 2) {
    return null;
  }

  const labels = strategyStats.map((s) => s.strategy_label);
  const seriesColors = COLORS.SERIES;
  const formatRatio = (ratio) => (ratio === null ? "-" : `${ratio.toFixed(2)}:1`);
  const formatPercent = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const strategyTableColumns = [
    {
      name: "전략",
      selector: (row) => row.strategy_label,
      cell: (row, index) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: seriesColors[index % seriesColors.length],
              flexShrink: 0,
            }}
          />
          {row.strategy_label}
        </Box>
      ),
    },
    {
      name: "거래 수",
      selector: (row) => row.total_count,
      format: (row) => `${row.total_count}건`,
      right: true,
    },
    {
      name: "청산완료",
      selector: (row) => row.closed_count,
      format: (row) => `${row.closed_count}건`,
      right: true,
    },
    {
      name: "승률",
      selector: (row) => row.win_rate,
      format: (row) => `${row.win_rate.toFixed(1)}%`,
      right: true,
    },
    {
      name: "총 손익",
      selector: (row) => row.total_profit_loss,
      cell: (row) => (
        <Box
          sx={{ color: row.total_profit_loss >= 0 ? COLORS.UP : COLORS.DOWN, fontWeight: "bold" }}
        >
          {row.total_profit_loss >= 0 ? "+" : ""}
          {formatCurrency(row.total_profit_loss)}원
        </Box>
      ),
      right: true,
    },
    {
      name: "평균 손익",
      selector: (row) => row.avg_profit_loss,
      cell: (row) => (
        <Box sx={{ color: row.avg_profit_loss >= 0 ? COLORS.UP : COLORS.DOWN }}>
          {row.avg_profit_loss >= 0 ? "+" : ""}
          {formatCurrency(row.avg_profit_loss)}원
        </Box>
      ),
      right: true,
    },
    {
      name: "평균 익절",
      selector: (row) => row.avg_win_percent,
      cell: (row) => (
        <Box sx={{ color: COLORS.UP }}>
          {row.winPercents.length > 0 ? formatPercent(row.avg_win_percent) : "-"}
        </Box>
      ),
      right: true,
    },
    {
      name: "평균 손절",
      selector: (row) => row.avg_loss_percent,
      cell: (row) => (
        <Box sx={{ color: COLORS.DOWN }}>
          {row.lossPercents.length > 0 ? formatPercent(row.avg_loss_percent) : "-"}
        </Box>
      ),
      right: true,
    },
    {
      name: "손익비",
      selector: (row) => row.payoff_ratio,
      format: (row) => formatRatio(row.payoff_ratio),
      right: true,
    },
  ];

  const chartSx = {
    "& .MuiChartsAxis-line": { stroke: COLORS.CHARTBOOK.GRID },
    "& .MuiChartsAxis-tickLabel": { fill: COLORS.CHARTBOOK.INK, fontSize: 11 },
    "& .MuiChartsYAxis-tickLabel": { fontFamily: MONO_STACK },
    "& .MuiChartsGrid-line": { stroke: COLORS.CHARTBOOK.GRID },
    "& .MuiBarElement-root": { transition: "opacity 0.15s ease" },
    "& .MuiBarElement-root:hover": { opacity: 0.75 },
    "& .MuiChartsLegend-label": { fontSize: 12 },
  };
  const bandAxis = { scaleType: "band", data: labels, disableTicks: true };

  return (
    <Card
      sx={{
        mb: 4,
        elevation: 0,
        border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
        backgroundColor: COLORS.CHARTBOOK.GROUND,
        borderRadius: "2px",
      }}
    >
      <CardContent>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: 15, fontWeight: 700, color: COLORS.CHARTBOOK.INK, mb: 0.5 }}
        >
          전략별 성과 비교
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          전략마다 승률·손익 편차가 크다면 이 표에서 어느 전략이 성과를 끌어내리는지 확인할 수
          있습니다.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
            mb: 3,
          }}
        >
          {[
            {
              label: "전체 평균 익절",
              value: formatPercent(overall.avg_win_percent),
              color: COLORS.UP,
            },
            {
              label: "전체 평균 손절",
              value: formatPercent(overall.avg_loss_percent),
              color: COLORS.DOWN,
            },
            {
              label: "전체 손익비 (평균익절 : 평균손절)",
              value: formatRatio(overall.payoff_ratio),
              color: COLORS.CHARTBOOK.INK,
            },
          ].map(({ label, value, color }, index) => (
            <Box
              key={label}
              sx={{
                flex: "1 1 200px",
                px: 2,
                py: 1.25,
                borderLeft: index > 0 ? `1px solid ${COLORS.CHARTBOOK.GRID}` : "none",
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: "block", mb: 0.25, color: "text.secondary" }}
              >
                {label}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color,
                  fontWeight: 700,
                  fontFamily: MONO_STACK,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box display="flex" flexDirection={{ xs: "column", lg: "row" }} gap={3}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, color: "text.secondary", fontWeight: 600 }}
            >
              전략별 승률 (%)
            </Typography>
            <BarChart
              height={260}
              series={[
                {
                  data: strategyStats.map((s) => Number(s.win_rate.toFixed(1))),
                  label: "승률(%)",
                  color: COLORS.CHARTBOOK.PANEL_BLUE,
                  valueFormatter: (v) => `${v}%`,
                },
              ]}
              xAxis={[bandAxis]}
              yAxis={[{ disableTicks: true }]}
              margin={{ top: 10, bottom: 30, left: 36, right: 10 }}
              grid={{ horizontal: true }}
              borderRadius={2}
              categoryGapRatio={0.45}
              slotProps={{ legend: { hidden: true } }}
              sx={chartSx}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, color: "text.secondary", fontWeight: 600 }}
            >
              전략별 총 손익 (원)
            </Typography>
            <BarChart
              height={260}
              series={[
                {
                  data: strategyStats.map((s) => s.total_profit_loss),
                  label: "총 손익(원)",
                  valueFormatter: (v) => `${formatCurrency(v)}원`,
                },
              ]}
              xAxis={[bandAxis]}
              yAxis={[
                {
                  disableTicks: true,
                  colorMap: {
                    type: "piecewise",
                    thresholds: [0],
                    colors: [COLORS.DOWN, COLORS.UP],
                  },
                },
              ]}
              margin={{ top: 10, bottom: 30, left: 56, right: 10 }}
              grid={{ horizontal: true }}
              borderRadius={2}
              categoryGapRatio={0.45}
              slotProps={{ legend: { hidden: true } }}
              sx={chartSx}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, color: "text.secondary", fontWeight: 600 }}
            >
              전략별 평균 익절 · 손절 (%) · 손익비
            </Typography>
            <ResponsiveChartContainer
              height={260}
              series={[
                {
                  type: "bar",
                  data: strategyStats.map((s) => Number(s.avg_win_percent.toFixed(2))),
                  label: "평균 익절(%)",
                  color: COLORS.UP,
                  yAxisId: "pct",
                  stack: "pnl",
                  valueFormatter: (v) => (v == null ? "-" : `+${v}%`),
                },
                {
                  type: "bar",
                  data: strategyStats.map((s) => Number(s.avg_loss_percent.toFixed(2))),
                  label: "평균 손절(%)",
                  color: COLORS.DOWN,
                  yAxisId: "pct",
                  stack: "pnl",
                  valueFormatter: (v) => (v == null ? "-" : `${v}%`),
                },
                {
                  type: "line",
                  data: strategyStats.map((s) => s.payoff_ratio),
                  label: "손익비",
                  color: COLORS.CHARTBOOK.INK,
                  yAxisId: "ratio",
                  curve: "linear",
                  valueFormatter: (v) => formatRatio(v),
                },
              ]}
              xAxis={[{ ...bandAxis, id: "x" }]}
              yAxis={[
                { id: "pct", disableTicks: true },
                { id: "ratio", position: "right", disableTicks: true },
              ]}
              margin={{ top: 34, bottom: 30, left: 36, right: 36 }}
              sx={chartSx}
            >
              <ChartsGrid horizontal />
              <BarPlot borderRadius={2} categoryGapRatio={0.45} barGapRatio={0.15} />
              <LinePlot />
              <MarkPlot />
              <ChartsXAxis axisId="x" />
              <ChartsYAxis axisId="pct" />
              <ChartsYAxis axisId="ratio" />
              <ChartsTooltip />
              <ChartsLegend position={{ vertical: "top", horizontal: "end" }} />
            </ResponsiveChartContainer>
          </Box>
        </Box>

        <Box mt={3}>
          <EnhancedDataTable
            columns={strategyTableColumns}
            data={strategyStats}
            keyField="strategy_type"
            autoOptimizeColumns={false}
            pagination={false}
            customStyles={{
              table: { style: { width: "100%", tableLayout: "auto", minWidth: 0 } },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

StrategyBreakdownChart.propTypes = {
  tradingReviews: PropTypes.arrayOf(
    PropTypes.shape({
      strategy_type: PropTypes.string,
      strategy_label: PropTypes.string,
      final_status: PropTypes.string,
      total_profit_loss: PropTypes.number,
    })
  ).isRequired,
};

export default StrategyBreakdownChart;
