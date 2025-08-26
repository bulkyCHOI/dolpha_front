/**
 * 매매복기 통계 컴포넌트
 */

import PropTypes from "prop-types";

// @mui material components
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Skeleton
} from "@mui/material";

// @mui icons
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PercentIcon from "@mui/icons-material/Percent";
import TradeIcon from "@mui/icons-material/Insights";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

// Utils
import { formatNumber, formatPercent } from "utils/formatters";

function TradingReviewsStats({ stats, loading }) {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="80%" height={32} />
                <Skeleton variant="text" width="40%" height={20} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" align="center" color="text.secondary">
            통계 데이터가 없습니다.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    total_count = 0,
    closed_count = 0,
    holding_count = 0,
    total_profit_loss = 0,
    avg_profit_loss = 0,
    win_rate = 0,
    profitable_count = 0
  } = stats;

  const loss_count = total_count - profitable_count;
  const profit_color = total_profit_loss > 0 ? "success" : total_profit_loss < 0 ? "error" : "default";
  const win_rate_color = win_rate >= 60 ? "success" : win_rate >= 40 ? "warning" : "error";

  const statCards = [
    {
      title: "전체 거래",
      value: total_count,
      subtitle: "총 거래 수",
      icon: <TradeIcon />,
      color: "primary",
      format: "number"
    },
    {
      title: "청산완료",
      value: closed_count,
      subtitle: `보유중: ${holding_count}건`,
      icon: <CheckCircleIcon />,
      color: "info",
      format: "number"
    },
    {
      title: "총 손익",
      value: total_profit_loss,
      subtitle: `평균: ${formatNumber(avg_profit_loss)}원`,
      icon: total_profit_loss >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
      color: profit_color,
      format: "currency"
    },
    {
      title: "승률",
      value: win_rate,
      subtitle: `${profitable_count}승 ${loss_count}패`,
      icon: <PercentIcon />,
      color: win_rate_color,
      format: "percent",
      progress: win_rate
    },
    {
      title: "수익 거래",
      value: profitable_count,
      subtitle: `전체의 ${total_count > 0 ? ((profitable_count / total_count) * 100).toFixed(1) : 0}%`,
      icon: <TrendingUpIcon />,
      color: "success",
      format: "number"
    },
    {
      title: "손실 거래",
      value: loss_count,
      subtitle: `전체의 ${total_count > 0 ? ((loss_count / total_count) * 100).toFixed(1) : 0}%`,
      icon: <TrendingDownIcon />,
      color: "error",
      format: "number"
    }
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case "currency":
        return `${value >= 0 ? '+' : ''}${formatNumber(value)}원`;
      case "percent":
        return `${formatPercent(value)}%`;
      case "number":
      default:
        return formatNumber(value);
    }
  };

  return (
    <Grid container spacing={3}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
          <Card
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Box color={`${stat.color}.main`} sx={{ display: 'flex', alignItems: 'center' }}>
                  {stat.icon}
                </Box>
              </Box>
              
              <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`} mb={1}>
                {formatValue(stat.value, stat.format)}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                {stat.subtitle}
              </Typography>

              {/* 승률 진행률 바 */}
              {stat.progress !== undefined && (
                <Box mt={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stat.progress, 100)}
                    color={stat.color}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200'
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* 요약 카드 */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              거래 요약
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip
                label={`총 ${total_count}건 거래`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`승률 ${formatPercent(win_rate)}%`}
                color={win_rate_color}
                variant="outlined"
              />
              <Chip
                label={`총 손익 ${total_profit_loss >= 0 ? '+' : ''}${formatNumber(total_profit_loss)}원`}
                color={profit_color}
                variant="outlined"
              />
              {closed_count > 0 && (
                <Chip
                  label={`청산완료 ${closed_count}건`}
                  color="info"
                  variant="outlined"
                  icon={<CheckCircleIcon />}
                />
              )}
              {holding_count > 0 && (
                <Chip
                  label={`보유중 ${holding_count}건`}
                  color="warning"
                  variant="outlined"
                  icon={<HourglassEmptyIcon />}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

TradingReviewsStats.propTypes = {
  stats: PropTypes.object,
  loading: PropTypes.bool,
};

export default TradingReviewsStats;