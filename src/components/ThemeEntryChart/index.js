import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";

import Typography from "@mui/material/Typography";
import { useThemeEntryChart } from "hooks/useThemeEntryChart";
import EntryDecisionChart from "./EntryDecisionChart";
import DecisionList from "./DecisionList";
import DecisionSummary, { ChartLegend } from "./DecisionSummary";
import { CHART_COLORS, decisionStatus } from "./constants";

const CHART_HEIGHT = 400;

/** 판정 이력을 종목별로 묶어 탭 목록을 만든다. */
function groupByStock(signals) {
  const grouped = new Map();

  signals.forEach((signal) => {
    const previous = grouped.get(signal.stock_code) ?? {
      stock_code: signal.stock_code,
      stock_name: signal.stock_name,
      theme_name: signal.theme_name,
      total: 0,
      passed: 0,
      executed: 0,
      best: 0,
    };
    const met =
      Number(signal.has_pullback) + Number(signal.has_breakout) + Number(signal.has_foreign_buying);

    grouped.set(signal.stock_code, {
      ...previous,
      theme_name: signal.theme_name || previous.theme_name,
      total: previous.total + 1,
      passed: previous.passed + Number(Boolean(signal.passed)),
      executed: previous.executed + Number(Boolean(signal.executed)),
      best: Math.max(previous.best, met),
    });
  });

  // 실제 진입 → 조건 충족 → 근접한 순. 볼 이유가 큰 종목이 앞에 온다
  return [...grouped.values()].sort(
    (a, b) => b.executed - a.executed || b.passed - a.passed || b.best - a.best || b.total - a.total
  );
}

/** 처음 보여줄 판정 — 실제 진입 > 조건 충족 > 가장 근접했던 판정 순. */
function defaultDecision(decisions) {
  const executed = [...decisions].reverse().find((d) => d.executed);
  if (executed) return executed;

  const passed = [...decisions].reverse().find((d) => d.passed);
  if (passed) return passed;

  return decisions.reduce(
    (best, current) => (current.conditions_met >= best.conditions_met ? current : best),
    decisions[0]
  );
}

function StockTabLabel({ stock }) {
  const badge = stock.executed
    ? { label: `진입 ${stock.executed}`, ...decisionStatus({ executed: true }) }
    : stock.passed
    ? { label: `충족 ${stock.passed}`, ...decisionStatus({ passed: true }) }
    : { label: `${stock.best}/3`, ...decisionStatus(null) };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, textTransform: "none" }}>
      <Box sx={{ textAlign: "left" }}>
        <Typography variant="button" sx={{ fontSize: 13, fontWeight: 700, display: "block" }}>
          {stock.stock_name}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: CHART_COLORS.MUTED }}>
          {stock.theme_name || stock.stock_code} · {stock.total}회
        </Typography>
      </Box>
      <Chip
        size="small"
        label={badge.label}
        sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: badge.bg, color: badge.color }}
      />
    </Box>
  );
}

StockTabLabel.propTypes = { stock: PropTypes.object.isRequired };

/**
 * 진입 조건 판정 차트.
 *
 * 종목 탭 → 1분봉 차트 → 판정 이력 목록 순으로 좁혀 본다.
 * 판정을 고르면 그 시점에 전고점·눌림 구간이 어디로 잡혔는지 차트에 그려진다.
 */
function ThemeEntryChart({ date, signals, authFetch, isAuthenticated }) {
  const stocks = useMemo(() => groupByStock(signals), [signals]);
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [onlyMeaningful, setOnlyMeaningful] = useState(true);

  useEffect(() => {
    if (stocks.length === 0) {
      setSelectedCode("");
      return;
    }
    if (!stocks.some((stock) => stock.stock_code === selectedCode)) {
      setSelectedCode(stocks[0].stock_code);
    }
  }, [stocks, selectedCode]);

  const { chart, loading, error } = useThemeEntryChart(date, selectedCode, authFetch);
  const decisions = chart.decisions;

  useEffect(() => {
    if (decisions.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!decisions.some((decision) => decision.id === selectedId)) {
      setSelectedId(defaultDecision(decisions).id);
    }
  }, [decisions, selectedId]);

  const selectedDecision = decisions.find((decision) => decision.id === selectedId) ?? null;

  // 하루 100건이 넘는 판정 중 대부분은 0/3 대기라 목록을 채우기만 한다.
  // 조건이 하나라도 걸린 판정만 추려 볼 수 있게 한다.
  const meaningful = useMemo(
    () => decisions.filter((decision) => decision.conditions_met > 0 || decision.passed),
    [decisions]
  );
  const listDecisions = onlyMeaningful && meaningful.length > 0 ? meaningful : decisions;

  if (!isAuthenticated) {
    return (
      <Alert severity="info">로그인하면 내 종목의 진입 판정이 1분봉 차트 위에 표시됩니다.</Alert>
    );
  }

  if (stocks.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: CHART_COLORS.MUTED, fontSize: 13 }}>
          판정 이력이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={selectedCode || false}
        onChange={(event, value) => setSelectedCode(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 46,
          borderBottom: "1px solid #eef1f4",
          mb: 1.5,
          "& .MuiTabs-indicator": { height: 2, bgcolor: "#4c51bf" },
          "& .MuiTab-root": { minHeight: 46, py: 0.5, px: 1.5 },
          "& .MuiTabs-flexContainer": { gap: 0.5 },
        }}
      >
        {stocks.map((stock) => (
          <Tab
            key={stock.stock_code}
            value={stock.stock_code}
            label={<StockTabLabel stock={stock} />}
          />
        ))}
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={CHART_HEIGHT} />
      ) : chart.bars.length === 0 ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: CHART_COLORS.MUTED, fontSize: 13 }}>
            {chart.stock_name || selectedCode}의 1분봉이 저장되어 있지 않아 차트를 그릴 수 없습니다.
          </Typography>
          <Typography variant="caption" sx={{ color: "#9aa5b1" }}>
            분봉은 자동매매 사이클이 돌 때 수집됩니다.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={1.5}>
            <Grid item xs={12} lg={9}>
              <Box sx={{ border: "1px solid #eef1f4", borderRadius: 1.5, overflow: "hidden" }}>
                <EntryDecisionChart
                  bars={chart.bars}
                  decision={selectedDecision}
                  height={CHART_HEIGHT}
                />
              </Box>
            </Grid>
            <Grid item xs={12} lg={3}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: 11, color: CHART_COLORS.MUTED }}>
                  판정 {listDecisions.length}건 · 눌러서 시점 이동
                </Typography>
                {meaningful.length > 0 && meaningful.length < decisions.length && (
                  <Chip
                    size="small"
                    clickable
                    label={
                      onlyMeaningful
                        ? `조건 근접만 ${meaningful.length}`
                        : `전체 ${decisions.length}`
                    }
                    onClick={() => setOnlyMeaningful((only) => !only)}
                    sx={{
                      height: 20,
                      fontSize: 10.5,
                      fontWeight: 600,
                      bgcolor: onlyMeaningful ? "#eef2ff" : "#eceff1",
                      color: onlyMeaningful ? "#4c51bf" : CHART_COLORS.MUTED,
                    }}
                  />
                )}
              </Box>
              <DecisionList
                decisions={listDecisions}
                selectedId={selectedId}
                onSelect={(decision) => setSelectedId(decision.id)}
                maxHeight={CHART_HEIGHT - 26}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 1 }}>
            <ChartLegend />
          </Box>

          <Divider sx={{ my: 1.5 }} />
          <DecisionSummary decision={selectedDecision} params={chart.params} />
        </>
      )}
    </Box>
  );
}

ThemeEntryChart.propTypes = {
  date: PropTypes.string.isRequired,
  signals: PropTypes.array,
  authFetch: PropTypes.func,
  isAuthenticated: PropTypes.bool,
};

ThemeEntryChart.defaultProps = { signals: [], authFetch: null, isAuthenticated: false };

export default ThemeEntryChart;
