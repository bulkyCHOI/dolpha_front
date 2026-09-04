import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import BoltIcon from "@mui/icons-material/Bolt";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ScheduleIcon from "@mui/icons-material/Schedule";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TableRowsIcon from "@mui/icons-material/TableRows";

import Typography from "@mui/material/Typography";
import AppHeader from "components/AppHeader";
import routes from "routes";
import { useAuth } from "contexts/AuthContext";
import { useNotification } from "components/NotificationSystem/NotificationSystem";
import EnhancedDataTable from "components/EnhancedDataTable";
import FullWidthContainer from "components/FullWidthContainer";
import ThemeTimeline, { TimelineLegend } from "components/ThemeTimeline/ThemeTimeline";
import ThemeSurgePositions from "components/ThemeSurgePositions/ThemeSurgePositions";
import ThemeEntryChart from "components/ThemeEntryChart";
import ThemeRateLineChart from "components/ThemeRateLineChart";
import { useThemeSurgeData, todayKST } from "hooks/useThemeSurgeData";
import { useThemeSurgePositions } from "hooks/useThemeSurgePositions";
import ChartbookHeader from "components/ChartbookHeader/ChartbookHeader";
import { COLORS, alpha } from "constants/styles";
import { formatNumber } from "utils/formatters";

const AUTO_REFRESH_MS = 60000;
const LIVE_THEME_LIMIT = 10;

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const RISE = COLORS.UP;
const FALL = COLORS.DOWN;
const MUTED = COLORS.CHARTBOOK.INK;

const cardSx = {
  p: 2.5,
  borderRadius: 0,
  backgroundColor: COLORS.CHARTBOOK.GROUND,
  border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
  boxShadow: "none",
};

const rateColor = (rate) => (rate >= 0 ? RISE : FALL);
const signed = (rate) => `${rate >= 0 ? "+" : ""}${rate}%`;

function StatCard({ icon: Icon, label, value, unit, accent }) {
  return (
    <Card sx={{ ...cardSx, p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(accent, 0.12),
          color: accent,
          flexShrink: 0,
          border: `1px solid ${accent}66`,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, display: "block", lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontFamily: MONO_STACK }}>
            {unit}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
};

function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Card sx={{ ...cardSx, ...sx }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 15, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, display: "block", mt: 0.25, fontSize: 12 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Card>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};

SectionCard.defaultProps = { subtitle: null, action: null, sx: {} };

function StockCell({ name, code }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="body2"
        fontWeight="bold"
        color="text.primary"
        sx={{ lineHeight: 1.2, fontSize: 13 }}
      >
        {name}
      </Typography>
      {code && (
        <Typography
          variant="caption"
          sx={{ color: COLORS.CHARTBOOK.INK, lineHeight: 1, fontSize: 11, fontFamily: MONO_STACK, fontWeight: 500 }}
        >
          {code}
        </Typography>
      )}
    </Box>
  );
}

StockCell.propTypes = { name: PropTypes.string.isRequired, code: PropTypes.string };
StockCell.defaultProps = { code: "" };

/** 실시간 랭킹 표 전용 — 테마명과 주도주를 한 줄에 나란히 둔다 */
function ThemeInlineCell({ name, leader }) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.6, minWidth: 0 }}>
      <Typography
        variant="body2"
        fontWeight="bold"
        color="text.primary"
        sx={{ fontSize: 12, lineHeight: 1.05, whiteSpace: "nowrap" }}
      >
        {name}
      </Typography>
      {leader && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 10.5,
            lineHeight: 1.05,
            color: COLORS.CHARTBOOK.INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: MONO_STACK,
          }}
        >
          {leader}
        </Typography>
      )}
    </Box>
  );
}

ThemeInlineCell.propTypes = { name: PropTypes.string.isRequired, leader: PropTypes.string };
ThemeInlineCell.defaultProps = { leader: "" };

function RateCell({ value }) {
  return (
    <Typography variant="button" sx={{ fontSize: 13, fontWeight: 700, color: rateColor(value), fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
      {signed(value)}
    </Typography>
  );
}

RateCell.propTypes = { value: PropTypes.number.isRequired };

function ConditionMark({ ok }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 18,
        height: 18,
        borderRadius: 0,
        bgcolor: "transparent",
        color: ok ? COLORS.CHARTBOOK.BAND_WEAK : COLORS.CHARTBOOK.INK,
        border: `1px solid ${ok ? COLORS.CHARTBOOK.BAND_WEAK : COLORS.CHARTBOOK.GRID}`,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: "16px",
        textAlign: "center",
      }}
    >
      {ok ? "✓" : "·"}
    </Box>
  );
}

ConditionMark.propTypes = { ok: PropTypes.bool };
ConditionMark.defaultProps = { ok: false };

/**
 * EnhancedDataTable 공용 스타일 오버라이드.
 *
 * 기본값은 15컬럼짜리 자동매매 설정 표 기준이라 table.minWidth 가 1200px 로 박혀 있다.
 * 이 페이지의 표는 4~6컬럼이라 그대로 쓰면 카드 밖으로 넘치므로 최소 너비만 낮추고,
 * 나머지 룩앤필(헤더 배경·줄무늬·호버)은 동일하게 유지한다.
 */
const tableStyles = (minWidth, compact = false) => ({
  table: {
    style: { width: "100%", tableLayout: "auto", minWidth, backgroundColor: COLORS.CHARTBOOK.GROUND },
  },
  headRow: {
    style: {
      backgroundColor: COLORS.CHARTBOOK.GROUND,
      borderBottomWidth: "1px",
      borderBottomColor: COLORS.CHARTBOOK.GRID,
      fontSize: "12px",
      fontWeight: 700,
      color: COLORS.CHARTBOOK.INK,
      minHeight: compact ? "24px" : "40px",
      fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
    },
  },
  headCells: {
    style: {
      whiteSpace: "nowrap",
      overflow: "visible",
      textOverflow: "unset",
      padding: compact ? "0px 6px" : "8px",
      minHeight: compact ? "24px" : "40px",
      borderRight: `1px solid ${COLORS.CHARTBOOK.GRID}`,
    },
  },
  rows: {
    style: {
      backgroundColor: COLORS.CHARTBOOK.GROUND,
      color: COLORS.CHARTBOOK.INK,
      minHeight: compact ? "0px" : "48px",
      lineHeight: compact ? 1.1 : "inherit",
      fontSize: "13px",
      "&:not(:last-of-type)": { borderBottomColor: COLORS.CHARTBOOK.GRID },
      "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06) },
    },
  },
  cells: { style: { color: COLORS.CHARTBOOK.INK, padding: compact ? "0px 6px" : "8px", borderRight: `1px solid ${COLORS.CHARTBOOK.GRID}` } },
  pagination: {
    style: {
      backgroundColor: COLORS.CHARTBOOK.GROUND,
      borderTop: `1px solid ${COLORS.CHARTBOOK.GRID}`,
      fontSize: "12px",
      color: COLORS.CHARTBOOK.INK,
    },
  },
});

const NO_DATA = (message) => (
  <Box sx={{ py: 5, textAlign: "center", width: "100%" }}>
    <Typography variant="body2" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 13 }}>
      {message}
    </Typography>
  </Box>
);

function ThemeSurge() {
  const [date, setDate] = useState(todayKST());
  const [scanning, setScanning] = useState(false);
  const [showSignalTable, setShowSignalTable] = useState(false);
  const { isAuthenticated, authenticatedFetch } = useAuth();
  const { showSnackbar, NotificationComponent } = useNotification();

  const authFetch = isAuthenticated ? authenticatedFetch : null;

  const { timeline, liveThemes, loading, error, lastUpdated, refresh, triggerScan } =
    useThemeSurgeData(date, authFetch, AUTO_REFRESH_MS);

  const topLiveThemes = useMemo(() => liveThemes.slice(0, LIVE_THEME_LIMIT), [liveThemes]);

  const {
    positions,
    watching,
    summary: positionSummary,
    loading: positionsLoading,
    error: positionsError,
    refresh: refreshPositions,
  } = useThemeSurgePositions(date, authFetch, AUTO_REFRESH_MS);

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = await triggerScan();
      showSnackbar(
        `${result.slot} 스캔 완료 — 급등 테마 ${result.surges}개, 후보 ${result.candidates}개`,
        "success"
      );
      refreshPositions();
    } catch (e) {
      showSnackbar(e.message, "error");
    } finally {
      setScanning(false);
    }
  };

  const handleRefresh = () => {
    refresh();
    refreshPositions();
  };

  const { summary } = timeline;
  const lastSlot = timeline.themes.length
    ? timeline.slots[
        Math.max(...timeline.themes.map((t) => t.cells.reduce((acc, c, i) => (c ? i : acc), 0)))
      ]
    : null;

  // ── 표 컬럼 정의 (EnhancedDataTable: div 기반이라 헤더/바디 정렬이 항상 일치) ──
  const liveColumns = [
    { name: "#", selector: (r) => r.rank, width: "40px", compact: true },
    {
      name: "테마",
      selector: (r) => r.theme_name,
      sortable: true,
      grow: 1,
      minWidth: "96px",
      cell: (r) => <ThemeInlineCell name={r.theme_name} leader={r.leading_stock_name} />,
    },
    {
      name: "등락률",
      selector: (r) => r.fluctuation_rate,
      sortable: true,
      right: true,
      width: "68px",
      cell: (r) => <RateCell value={r.fluctuation_rate} />,
    },
    {
      name: "거래대금",
      selector: (r) => r.trading_value,
      sortable: true,
      right: true,
      width: "76px",
      cell: (r) => formatNumber(r.trading_value),
    },
  ];

  const signalColumns = [
    { name: "시각", selector: (r) => r.time, width: "72px" },
    {
      name: "종목",
      selector: (r) => r.stock_name,
      sortable: true,
      minWidth: "130px",
      maxWidth: "180px",
      cell: (r) => <StockCell name={r.stock_name} code={r.stock_code} />,
    },
    {
      name: "현재가",
      selector: (r) => r.price,
      right: true,
      width: "96px",
      cell: (r) => (r.price || 0).toLocaleString(),
    },
    {
      name: "전고점",
      selector: (r) => r.prev_high,
      right: true,
      width: "96px",
      cell: (r) => (r.prev_high ? r.prev_high.toLocaleString() : "—"),
    },
    {
      name: "눌림목",
      selector: (r) => r.has_pullback,
      center: true,
      width: "72px",
      cell: (r) => <ConditionMark ok={r.has_pullback} />,
    },
    {
      name: "돌파",
      selector: (r) => r.has_breakout,
      center: true,
      width: "64px",
      cell: (r) => <ConditionMark ok={r.has_breakout} />,
    },
    {
      name: "외국인",
      selector: (r) => r.has_foreign_buying,
      center: true,
      width: "72px",
      cell: (r) => <ConditionMark ok={r.has_foreign_buying} />,
    },
    {
      name: "결과",
      selector: (r) => r.executed,
      center: true,
      width: "80px",
      cell: (r) => {
        const chipColor = r.executed ? COLORS.CHARTBOOK.BAND_STRONG : r.passed ? COLORS.CHARTBOOK.BAND_MID : COLORS.CHARTBOOK.INK;
        return (
          <Chip
            size="small"
            label={r.executed ? "진입" : r.passed ? "충족" : "대기"}
            sx={{
              height: 20,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: "transparent",
              border: `1px solid ${chipColor}`,
              color: chipColor,
              borderRadius: "2px",
              fontFamily: MONO_STACK,
            }}
          />
        );
      },
    },
    {
      name: "사유",
      selector: (r) => r.reason,
      grow: 2,
      wrap: true,
      cell: (r) => (
        <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 11.5, lineHeight: 1.5 }}>
          {r.reason}
        </Typography>
      ),
    },
  ];

  return (
    <>
      <AppHeader routes={routes} sticky />
      <Box sx={{ height: "80px", flexShrink: 0, backgroundColor: COLORS.CHARTBOOK.GROUND }} />
      <ChartbookHeader
        strategyName="급등테마주"
        date={new Date(date).toLocaleDateString("ko-KR")}
        candidateCount={summary?.surge_theme_count || 0}
      />
      <Box minHeight="100vh" pb={5} sx={{ bgcolor: COLORS.CHARTBOOK.GROUND }}>
        <FullWidthContainer>
          {/* ── 헤더 ───────────────────────────────── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              mb: 2.5,
            }}
          >
            <Box sx={{ maxWidth: 640 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.3, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
                급등테마주 자동매매
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.CHARTBOOK.INK, mt: 0.5, fontSize: 13.5 }}>
                개장일 09:00~15:30 동안 토스증권 &apos;지금 뜨는 산업&apos;을 5분마다 수집해 급등
                테마의 주도주를 고르고, 1분봉에서{" "}
                <strong>눌림목 → 전고점 돌파 → 외국인 매수세</strong>가 갖춰지면 매수합니다.
                익절·손절은 Manual 기본 설정을 따릅니다.
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}
              >
                {lastSlot && (
                  <Chip
                    size="small"
                    label={`${lastSlot} 까지 수집`}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      backgroundColor: "transparent",
                      border: `1px solid ${COLORS.CHARTBOOK.PANEL_BLUE}`,
                      color: COLORS.CHARTBOOK.INK,
                      borderRadius: "2px",
                      fontFamily: MONO_STACK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                )}
                {lastUpdated && (
                  <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 12, fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
                    최종 갱신 {lastUpdated.toLocaleTimeString("ko-KR")} · 1분마다 자동 갱신
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <TextField
                type="date"
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                sx={{
                  bgcolor: COLORS.CHARTBOOK.GROUND,
                  border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                  width: { xs: "100%", sm: 160 },
                  "& .MuiInputBase-input": { fontSize: 13, color: COLORS.CHARTBOOK.INK },
                  "& fieldset": { borderColor: COLORS.CHARTBOOK.GRID },
                }}
              />
              <Button
                variant="outlined"
                size="medium"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  bgcolor: COLORS.CHARTBOOK.GROUND,
                  whiteSpace: "nowrap",
                  color: `${COLORS.CHARTBOOK.PANEL_BLUE} !important`,
                  borderColor: `${COLORS.CHARTBOOK.GRID} !important`,
                  border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                  "&:hover": {
                    bgcolor: alpha(COLORS.CHARTBOOK.INK, 0.06),
                    borderColor: `${COLORS.CHARTBOOK.PANEL_BLUE} !important`,
                  },
                  "&.Mui-disabled": {
                    color: `${COLORS.CHARTBOOK.INK} !important`,
                    borderColor: `${COLORS.CHARTBOOK.GRID} !important`,
                  },
                }}
              >
                새로고침
              </Button>
              <Button
                variant="contained"
                size="medium"
                startIcon={<BoltIcon />}
                onClick={handleScan}
                disabled={scanning || !isAuthenticated}
                sx={{
                  background: COLORS.CHARTBOOK.PANEL_BLUE,
                  color: "#ffffff !important",
                  whiteSpace: "nowrap",
                  boxShadow: "none",
                  "&:hover": { background: alpha(COLORS.CHARTBOOK.PANEL_BLUE, 0.85), boxShadow: "none" },
                  "&.Mui-disabled": {
                    background: COLORS.CHARTBOOK.GRID,
                    color: `${COLORS.CHARTBOOK.INK} !important`,
                  },
                }}
              >
                {scanning ? "스캔 중…" : "지금 스캔"}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}` }}>
              {error}
            </Alert>
          )}

          {/* ── 1. 자동매매 현황 (가장 위) ────────────── */}
          <ThemeSurgePositions
            positions={positions}
            watching={watching}
            summary={positionSummary}
            loading={positionsLoading}
            error={positionsError}
            isAuthenticated={isAuthenticated}
          />

          {/* ── 2. 오늘 요약 ───────────────────────── */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <StatCard
                icon={WhatshotIcon}
                label="급등 테마"
                value={summary.surge_theme_count}
                unit="개"
                accent={RISE}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                icon={ScheduleIcon}
                label="수집 슬롯"
                value={summary.scanned_slots}
                unit={`/ ${timeline.slots.length}`}
                accent={COLORS.PRIMARY_BLUE}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                icon={FactCheckIcon}
                label="진입 판정"
                value={summary.signal_count}
                unit="회"
                accent="#546e7a"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                icon={ShoppingCartIcon}
                label="실제 진입"
                value={summary.entry_count}
                unit="건"
                accent={COLORS.SUCCESS}
              />
            </Grid>
          </Grid>

          {/* ── 3. 타임라인 ────────────────────────── */}
          <Box sx={{ mt: 2 }}>
            <SectionCard
              title="급등 테마 타임라인 (09:00 ~ 15:30)"
              subtitle="가로축 = 5분 슬롯 · 색 = 테마 등락률 · 주황 밴드 = 급등 판정 구간 · 점 = 주도주 진입 판정 · 급등 구간이 길고 등락률이 높은 순으로 정렬"
              action={<TimelineLegend />}
            >
              {loading ? (
                <Box display="flex" justifyContent="center" py={7}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <ThemeTimeline
                  slots={timeline.slots}
                  themes={timeline.themes}
                  signals={timeline.signals}
                  date={date}
                />
              )}
            </SectionCard>
          </Box>

          {/* ── 4. 실시간 랭킹 + 산업군 등락률 추이 ── */}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} lg={4} xl={3.6}>
              <SectionCard
                title="지금 뜨는 산업"
                subtitle="토스증권 테마 랭킹 상위 10개"
                action={
                  <Chip
                    size="small"
                    label="실시간"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      backgroundColor: "transparent",
                      border: `1px solid ${COLORS.CHARTBOOK.BAND_WEAK}`,
                      color: COLORS.CHARTBOOK.BAND_WEAK,
                      borderRadius: "2px",
                      fontFamily: MONO_STACK,
                    }}
                  />
                }
                sx={{ height: "100%", p: 1.75 }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <EnhancedDataTable
                    columns={liveColumns}
                    data={topLiveThemes}
                    autoOptimizeColumns={false}
                    striped={false}
                    dense
                    pagination={false}
                    customStyles={tableStyles("0px", true)}
                    noDataComponent={NO_DATA("조회된 테마가 없습니다.")}
                  />
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={8} xl={8.4}>
              <SectionCard
                title="산업군별 등락률 추이 (09:00 ~ 15:30)"
                subtitle="가로 = 시각 · 세로 = 등락률 · 범례를 클릭하면 해당 산업군을 숨기거나 다시 표시합니다"
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <ThemeRateLineChart
                  slots={timeline.slots}
                  themes={timeline.themes}
                  loading={loading}
                />
              </SectionCard>
            </Grid>
          </Grid>

          {/* ── 5. 진입/청산 조건 판정 (차트 + 표) ───── */}
          {/*
            섹션을 조건부로 숨기지 않는다. 로그인이 풀렸거나 판정 이력이 없으면
            차트가 통째로 사라져 "왜 안 보이는지" 알 수 없었다.
            비어 있는 사유는 ThemeEntryChart 가 안내 문구로 직접 보여 준다.
          */}
          <Box sx={{ mt: 2 }}>
            <SectionCard
              title="진입/청산 조건 판정"
              subtitle="종목 탭에서 판정 시점을 고르면, 그때 전고점·눌림목이 1분봉 어디로 잡혔는지 차트에 그려집니다. 3조건이 모두 ✓ 여야 매수하며, 청산은 아래 표에서 확인할 수 있습니다"
              action={
                timeline.signals.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<TableRowsIcon />}
                    onClick={() => setShowSignalTable((shown) => !shown)}
                    sx={{
                      color: `${COLORS.CHARTBOOK.PANEL_BLUE} !important`,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showSignalTable ? "표 접기" : "전체 표로 보기"}
                  </Button>
                )
              }
            >
              <ThemeEntryChart
                date={date}
                signals={timeline.signals}
                authFetch={authFetch}
                isAuthenticated={isAuthenticated}
              />

              <Collapse in={showSignalTable} unmountOnExit>
                <Divider sx={{ my: 2, borderColor: COLORS.CHARTBOOK.GRID }} />
                <Box sx={{ overflowX: "auto" }}>
                  <EnhancedDataTable
                    columns={signalColumns}
                    data={timeline.signals}
                    autoOptimizeColumns={false}
                    striped={false}
                    dense
                    pagination
                    paginationPerPage={15}
                    customStyles={tableStyles("880px")}
                    noDataComponent={NO_DATA("판정 이력이 없습니다.")}
                  />
                </Box>
              </Collapse>
            </SectionCard>
          </Box>

          <Divider sx={{ my: 3, borderColor: COLORS.CHARTBOOK.GRID }} />
          <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 12, fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif" }}>
            데이터 출처: 토스증권 산업분류(TICS) 랭킹 · 수급 데이터: 한국투자증권 API. 수집은 개장일
            09:00~15:30에만 이루어집니다. 표시된 정보는 투자 판단의 참고용이며 투자 권유가 아닙니다.
          </Typography>
        </FullWidthContainer>
      </Box>
      <NotificationComponent />
    </>
  );
}

export default ThemeSurge;
