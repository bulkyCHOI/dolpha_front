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
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import BoltIcon from "@mui/icons-material/Bolt";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ScheduleIcon from "@mui/icons-material/Schedule";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TableRowsIcon from "@mui/icons-material/TableRows";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import routes from "routes";
import { useAuth } from "contexts/AuthContext";
import { useNotification } from "components/NotificationSystem/NotificationSystem";
import EnhancedDataTable from "components/EnhancedDataTable";
import ThemeTimeline, { TimelineLegend } from "components/ThemeTimeline/ThemeTimeline";
import ThemeSurgePositions from "components/ThemeSurgePositions/ThemeSurgePositions";
import ThemeEntryChart from "components/ThemeEntryChart";
import { useThemeSurgeData, todayKST } from "hooks/useThemeSurgeData";
import { useThemeSurgePositions } from "hooks/useThemeSurgePositions";
import { COLORS, GRADIENT_COLORS } from "constants/styles";
import { formatNumber } from "utils/formatters";

const AUTO_REFRESH_MS = 60000;
const LIVE_THEME_LIMIT = 10;

const RISE = "#d32f2f";
const FALL = "#1565c0";
const MUTED = "#7b8794";

const cardSx = {
  p: 2.5,
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
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
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: `${accent}1f`,
          color: accent,
          flexShrink: 0,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <MKTypography variant="caption" sx={{ color: MUTED, display: "block", lineHeight: 1.2 }}>
          {label}
        </MKTypography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <MKTypography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
            {value}
          </MKTypography>
          <MKTypography variant="caption" sx={{ color: MUTED }}>
            {unit}
          </MKTypography>
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
          <MKTypography variant="h6" fontWeight="bold" sx={{ fontSize: 15 }}>
            {title}
          </MKTypography>
          {subtitle && (
            <MKTypography variant="caption" sx={{ color: MUTED, display: "block", mt: 0.25 }}>
              {subtitle}
            </MKTypography>
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
      <MKTypography
        variant="body2"
        fontWeight="bold"
        color="dark"
        sx={{ lineHeight: 1.2, fontSize: 13 }}
      >
        {name}
      </MKTypography>
      {code && (
        <MKTypography variant="caption" sx={{ color: "#9aa5b1", lineHeight: 1, fontSize: 11 }}>
          {code}
        </MKTypography>
      )}
    </Box>
  );
}

StockCell.propTypes = { name: PropTypes.string.isRequired, code: PropTypes.string };
StockCell.defaultProps = { code: "" };

function RateCell({ value }) {
  return (
    <MKTypography variant="button" sx={{ fontSize: 13, fontWeight: 700, color: rateColor(value) }}>
      {signed(value)}
    </MKTypography>
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
        borderRadius: "50%",
        bgcolor: ok ? "#e8f5e9" : "#f1f4f8",
        color: ok ? "#2e7d32" : "#c2ccd6",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: "18px",
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
const tableStyles = (minWidth) => ({
  table: { style: { width: "100%", tableLayout: "auto", minWidth } },
  headRow: {
    style: {
      backgroundColor: "#f8fafc",
      borderBottomWidth: "1px",
      borderBottomColor: "#e9ecef",
      fontSize: "12px",
      fontWeight: 700,
      color: MUTED,
      minHeight: "40px",
    },
  },
  headCells: {
    style: { whiteSpace: "nowrap", overflow: "visible", textOverflow: "unset", padding: "8px" },
  },
  rows: {
    style: {
      minHeight: "48px",
      fontSize: "13px",
      "&:not(:last-of-type)": { borderBottomColor: "#eef1f4" },
      "&:hover": { backgroundColor: "#f5f7ff !important" },
    },
  },
  cells: { style: { padding: "8px" } },
  pagination: {
    style: { backgroundColor: "#fff", borderTop: "1px solid #eef1f4", fontSize: "12px" },
  },
});

const NO_DATA = (message) => (
  <Box sx={{ py: 5, textAlign: "center", width: "100%" }}>
    <MKTypography variant="body2" sx={{ color: MUTED, fontSize: 13 }}>
      {message}
    </MKTypography>
  </Box>
);

function ThemeSurge() {
  const [date, setDate] = useState(todayKST());
  const [scanning, setScanning] = useState(false);
  const [showSignalTable, setShowSignalTable] = useState(false);
  const { isAuthenticated, authenticatedFetch } = useAuth();
  const { showSnackbar, NotificationComponent } = useNotification();

  const authFetch = isAuthenticated ? authenticatedFetch : null;

  const { timeline, liveThemes, candidates, loading, error, lastUpdated, refresh, triggerScan } =
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
  const candidateColumns = [
    { name: "시각", selector: (r) => r.slot, width: "72px" },
    {
      name: "테마",
      selector: (r) => r.theme_name,
      sortable: true,
      minWidth: "120px",
      maxWidth: "180px",
    },
    {
      name: "종목",
      selector: (r) => r.stock_name,
      sortable: true,
      grow: 1,
      minWidth: "150px",
      maxWidth: "300px",
      cell: (r) => <StockCell name={r.stock_name} code={r.stock_code} />,
    },
    {
      name: "상승률",
      selector: (r) => r.change_rate,
      sortable: true,
      right: true,
      width: "90px",
      cell: (r) => <RateCell value={r.change_rate} />,
    },
    {
      name: "거래대금",
      selector: (r) => r.trading_value,
      sortable: true,
      right: true,
      width: "104px",
      cell: (r) => formatNumber(r.trading_value),
    },
    {
      name: "점수",
      selector: (r) => r.score,
      sortable: true,
      right: true,
      width: "80px",
      cell: (r) => r.score.toFixed(3),
    },
  ];

  const liveColumns = [
    { name: "#", selector: (r) => r.rank, width: "48px" },
    {
      name: "테마",
      selector: (r) => r.theme_name,
      sortable: true,
      grow: 1,
      minWidth: "140px",
      maxWidth: "320px",
      cell: (r) => <StockCell name={r.theme_name} code={r.leading_stock_name} />,
    },
    {
      name: "등락률",
      selector: (r) => r.fluctuation_rate,
      sortable: true,
      right: true,
      width: "90px",
      cell: (r) => <RateCell value={r.fluctuation_rate} />,
    },
    {
      name: "거래대금",
      selector: (r) => r.trading_value,
      sortable: true,
      right: true,
      width: "104px",
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
      cell: (r) => (
        <Chip
          size="small"
          label={r.executed ? "진입" : r.passed ? "충족" : "대기"}
          sx={{
            height: 20,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: r.executed ? "#e8f5e9" : r.passed ? "#fff8e1" : "#eceff1",
            color: r.executed ? "#2e7d32" : r.passed ? "#ef6c00" : MUTED,
          }}
        />
      ),
    },
    {
      name: "사유",
      selector: (r) => r.reason,
      grow: 2,
      wrap: true,
      cell: (r) => (
        <MKTypography variant="caption" sx={{ color: MUTED, fontSize: 11.5, lineHeight: 1.5 }}>
          {r.reason}
        </MKTypography>
      ),
    },
  ];

  return (
    <>
      <DefaultNavbar routes={routes} sticky />
      <MKBox minHeight="100vh" pt={10} pb={5} sx={{ bgcolor: "#f4f6f8" }}>
        <Container maxWidth="xl">
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
              <MKTypography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                급등테마주 자동매매
              </MKTypography>
              <MKTypography variant="body2" sx={{ color: MUTED, mt: 0.5, fontSize: 13.5 }}>
                개장일 09:00~15:30 동안 토스증권 &apos;지금 뜨는 산업&apos;을 5분마다 수집해 급등
                테마의 주도주를 고르고, 1분봉에서{" "}
                <strong>눌림목 → 전고점 돌파 → 외국인 매수세</strong>가 갖춰지면 매수합니다.
                익절·손절은 Manual 기본 설정을 따릅니다.
              </MKTypography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}
              >
                {lastSlot && (
                  <Chip
                    size="small"
                    label={`${lastSlot} 까지 수집`}
                    sx={{ height: 20, fontSize: 11, bgcolor: "#eef2ff", color: "#4c51bf" }}
                  />
                )}
                {lastUpdated && (
                  <MKTypography variant="caption" sx={{ color: "#9aa5b1" }}>
                    최종 갱신 {lastUpdated.toLocaleTimeString("ko-KR")} · 1분마다 자동 갱신
                  </MKTypography>
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
                  bgcolor: "#fff",
                  width: { xs: "100%", sm: 160 },
                  "& .MuiInputBase-input": { fontSize: 13 },
                }}
              />
              {/* MK 테마의 outlined 기본 색이 거의 흰색이라 명시적으로 지정한다 */}
              <Button
                variant="outlined"
                size="medium"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  bgcolor: "#fff",
                  whiteSpace: "nowrap",
                  color: `${COLORS.PRIMARY_BLUE} !important`,
                  borderColor: `${COLORS.PRIMARY_BLUE}66 !important`,
                  "&:hover": {
                    bgcolor: COLORS.HOVER_BG,
                    borderColor: `${COLORS.PRIMARY_BLUE} !important`,
                  },
                  "&.Mui-disabled": {
                    color: "#b0bac5 !important",
                    borderColor: "#dfe3e8 !important",
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
                  background: GRADIENT_COLORS.PRIMARY,
                  color: "#fff !important",
                  whiteSpace: "nowrap",
                  boxShadow: "none",
                  "&:hover": { background: GRADIENT_COLORS.PRIMARY_HOVER, boxShadow: "none" },
                  "&.Mui-disabled": { background: "#e4e7ec", color: "#a0aab5 !important" },
                }}
              >
                {scanning ? "스캔 중…" : "지금 스캔"}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
                accent="#2e7d32"
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

          {/* ── 4. 주도주 / 실시간 랭킹 ─────────────── */}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} xl={7}>
              <SectionCard
                title="테마별 1등 종목"
                subtitle="거래대금과 상승률을 테마 내에서 정규화해 합산한 복합 점수 기준"
                sx={{ height: "100%" }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <EnhancedDataTable
                    columns={candidateColumns}
                    data={candidates}
                    autoOptimizeColumns={false}
                    striped={false}
                    dense
                    pagination
                    paginationPerPage={10}
                    customStyles={tableStyles("480px")}
                    noDataComponent={NO_DATA("선정된 주도주가 없습니다.")}
                  />
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12} xl={5}>
              <SectionCard
                title="지금 뜨는 산업"
                subtitle="토스증권 테마 랭킹 상위 10개"
                action={
                  <Chip
                    size="small"
                    label="실시간"
                    sx={{ height: 20, fontSize: 11, bgcolor: "#e8f5e9", color: "#2e7d32" }}
                  />
                }
                sx={{ height: "100%" }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <EnhancedDataTable
                    columns={liveColumns}
                    data={topLiveThemes}
                    autoOptimizeColumns={false}
                    striped={false}
                    dense
                    pagination={false}
                    customStyles={tableStyles("360px")}
                    noDataComponent={NO_DATA("조회된 테마가 없습니다.")}
                  />
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          {/* ── 5. 진입 조건 판정 (차트 + 표) ────────── */}
          {isAuthenticated && timeline.signals.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <SectionCard
                title="진입 조건 판정"
                subtitle="종목 탭에서 판정 시점을 고르면, 그때 전고점·눌림목이 1분봉 어디로 잡혔는지 차트에 그려집니다. 3조건이 모두 ✓ 여야 매수합니다"
                action={
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<TableRowsIcon />}
                    onClick={() => setShowSignalTable((shown) => !shown)}
                    sx={{
                      color: `${COLORS.PRIMARY_BLUE} !important`,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showSignalTable ? "표 접기" : "전체 표로 보기"}
                  </Button>
                }
              >
                <ThemeEntryChart
                  date={date}
                  signals={timeline.signals}
                  authFetch={authFetch}
                  isAuthenticated={isAuthenticated}
                />

                <Collapse in={showSignalTable} unmountOnExit>
                  <Divider sx={{ my: 2 }} />
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
          )}

          <Divider sx={{ my: 3 }} />
          <MKTypography variant="caption" sx={{ color: "#9aa5b1" }}>
            데이터 출처: 토스증권 산업분류(TICS) 랭킹 · 수급 데이터: 한국투자증권 API. 수집은 개장일
            09:00~15:30에만 이루어집니다. 표시된 정보는 투자 판단의 참고용이며 투자 권유가 아닙니다.
          </MKTypography>
        </Container>
      </MKBox>
      <NotificationComponent />
    </>
  );
}

export default ThemeSurge;
