import { useMemo } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import SsidChartIcon from "@mui/icons-material/SsidChart";

import TradingViewChart, { ChartLegend } from "components/TradingViewChart";

const CHART_HEIGHT = 220;

const COLORS = {
  totalMoney: "#1976d2",
  stockMoney: "#f57c00",
  profit: "rgba(56, 142, 60, 0.75)",
  loss: "rgba(211, 47, 47, 0.75)",
  profitLine: "#388e3c",
  lossLine: "#d32f2f",
};

/** 원 → 만원 */
const toManwon = (value) => Math.round((value ?? 0) / 10000);

const manwonFormat = {
  type: "custom",
  formatter: (value) => `${Math.round(value).toLocaleString("ko-KR")}만`,
  minMove: 1,
};

const signedManwonFormat = {
  type: "custom",
  formatter: (value) => `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString("ko-KR")}만`,
  minMove: 1,
};

const BASE_LINE_OPTIONS = {
  lineWidth: 2,
  priceLineVisible: false,
  lastValueVisible: true,
};

/**
 * 계좌 일별 현황 차트 (총 평가금액 / 확정 손익).
 * 종목 차트와 동일하게 TradingView 엔진을 사용한다.
 */
function AccountCharts({ accountSnapshots, dailyPnl, loading }) {
  const equitySeries = useMemo(
    () => [
      {
        id: "totalMoney",
        type: "area",
        pane: 0,
        data: accountSnapshots.map((snapshot) => ({
          time: snapshot.date,
          value: toManwon(snapshot.total_money),
        })),
        options: {
          ...BASE_LINE_OPTIONS,
          lineColor: COLORS.totalMoney,
          topColor: "rgba(25, 118, 210, 0.18)",
          bottomColor: "rgba(25, 118, 210, 0.02)",
          priceFormat: manwonFormat,
        },
      },
      {
        id: "stockMoney",
        type: "line",
        pane: 0,
        data: accountSnapshots.map((snapshot) => ({
          time: snapshot.date,
          value: toManwon(snapshot.stock_money),
        })),
        options: {
          ...BASE_LINE_OPTIONS,
          color: COLORS.stockMoney,
          priceScaleId: "left",
          priceFormat: manwonFormat,
        },
      },
    ],
    [accountSnapshots]
  );

  const pnlSeries = useMemo(() => {
    const pnlByDate = Object.fromEntries(dailyPnl.map((item) => [item.date, item.daily_pnl]));

    let cumulative = 0;
    const daily = [];
    const cumulativeData = [];

    accountSnapshots.forEach((snapshot) => {
      const value = toManwon(pnlByDate[snapshot.date] ?? 0);
      cumulative += value;
      daily.push({
        time: snapshot.date,
        value,
        color: value >= 0 ? COLORS.profit : COLORS.loss,
      });
      cumulativeData.push({ time: snapshot.date, value: cumulative });
    });

    return [
      {
        id: "dailyPnl",
        type: "histogram",
        pane: 0,
        data: daily,
        options: { priceLineVisible: false, priceFormat: signedManwonFormat },
      },
      {
        id: "cumulativePnl",
        type: "line",
        pane: 0,
        data: cumulativeData,
        options: {
          ...BASE_LINE_OPTIONS,
          color: cumulative >= 0 ? COLORS.profitLine : COLORS.lossLine,
          priceFormat: signedManwonFormat,
        },
      },
    ];
  }, [accountSnapshots, dailyPnl]);

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[0, 1].map((index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Skeleton variant="rectangular" height={CHART_HEIGHT} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (accountSnapshots.length === 0) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <SsidChartIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="subtitle2" fontWeight="bold">
            계좌 일별 현황
          </Typography>
          <Chip
            label={`최근 ${accountSnapshots.length}일`}
            size="small"
            sx={{ height: 20, fontSize: "0.65rem" }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ChartLegend
              groups={[
                {
                  title: "평가금액",
                  items: [
                    { field: "totalMoney", label: "총 평가금액", color: COLORS.totalMoney },
                    { field: "stockMoney", label: "주식 평가금액", color: COLORS.stockMoney },
                  ],
                },
              ]}
            />
            <TradingViewChart
              series={equitySeries}
              panes={[{ stretch: 1 }]}
              height={CHART_HEIGHT}
              fitContentKey={`equity-${accountSnapshots.length}`}
              chartOptions={{ leftPriceScale: { visible: true, borderColor: "#e2e8f0" } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartLegend
              groups={[
                {
                  title: "손익",
                  items: [
                    { field: "dailyPnl", label: "일자별 확정", color: COLORS.profitLine },
                    { field: "cumulativePnl", label: "누적", color: COLORS.totalMoney },
                  ],
                },
              ]}
            />
            <TradingViewChart
              series={pnlSeries}
              panes={[{ stretch: 1 }]}
              height={CHART_HEIGHT}
              fitContentKey={`pnl-${accountSnapshots.length}`}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

AccountCharts.propTypes = {
  accountSnapshots: PropTypes.array,
  dailyPnl: PropTypes.array,
  loading: PropTypes.bool,
};

AccountCharts.defaultProps = {
  accountSnapshots: [],
  dailyPnl: [],
  loading: false,
};

export default AccountCharts;
