/**
 * 데이터 관리 페이지
 * - Tab 1: 데이터 현황 (OHLCV / 기술적 분석 / 재무제표)
 * - Tab 2: 날짜별 빈 구간
 * - Tab 3: 실시간 로그 & 프로세스 상태
 * - Tab 4: 데이터 수집 (수동 트리거 + 날짜 선택)
 */

import { useState, useEffect, useRef, useCallback } from "react";

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import MKButton from "components/MKButton";
import MKDatePicker from "components/MKDatePicker";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

const apiBase = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString("ko-KR");
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "0.0");

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

// ─────────────────────────────────────────────
// Tab 1: 데이터 현황 카드
// ─────────────────────────────────────────────
function SummaryCard({ title, done, total, records, latestDate, extra }) {
  const progress = total ? (done / total) * 100 : 0;
  const color =
    progress >= 95 ? "success" : progress >= 70 ? "warning" : "error";

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <MKTypography variant="h6" fontWeight="bold" mb={1}>
          {title}
        </MKTypography>

        <MKTypography variant="h4" fontWeight="bold" color={color} mb={0.5}>
          {pct(done, total)}%
        </MKTypography>

        <LinearProgress
          variant="determinate"
          value={progress}
          color={color}
          sx={{ mb: 1, height: 6, borderRadius: 3 }}
        />

        <MKTypography variant="body2" color="text.secondary">
          수집 완료: <strong>{fmt(done)}</strong> / {fmt(total)} 종목
        </MKTypography>
        <MKTypography variant="body2" color="text.secondary">
          총 레코드: <strong>{fmt(records)}</strong>
        </MKTypography>
        {latestDate && (
          <MKTypography variant="body2" color="text.secondary">
            최신 날짜: <strong>{latestDate}</strong>
          </MKTypography>
        )}
        {extra && (
          <MKTypography variant="body2" color="text.secondary">
            {extra}
          </MKTypography>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisGapCard({ gap }) {
  if (!gap) return null;
  return (
    <Card elevation={2}>
      <CardContent>
        <MKTypography variant="h6" fontWeight="bold" mb={1}>
          분석 누락 현황
        </MKTypography>
        <MKTypography variant="body2" color="text.secondary">
          OHLCV만 있고 분석 없음:{" "}
          <strong style={{ color: gap.ohlcv_only > 0 ? "#f44336" : "#4caf50" }}>
            {fmt(gap.ohlcv_only)}종목
          </strong>
        </MKTypography>
        <MKTypography variant="body2" color="text.secondary">
          OHLCV 최신일: <strong>{gap.ohlcv_latest || "-"}</strong>
        </MKTypography>
        <MKTypography variant="body2" color="text.secondary">
          분석 최신일: <strong>{gap.analysis_latest || "-"}</strong>
        </MKTypography>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Tab 2: 날짜별 파이프라인 격자
// ─────────────────────────────────────────────
function cellColor(ratio) {
  if (ratio === undefined || ratio === null) return { bg: "#f0f0f0", text: "#aaa" };
  if (ratio >= 95) return { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" };
  if (ratio >= 70) return { bg: "#fff8e1", text: "#e65100", border: "#ffe082" };
  return { bg: "#ffebee", text: "#c62828", border: "#ef9a9a" };
}

function GridCell({ dateKey, step }) {
  const data = step.by_date[dateKey];
  const { bg, text, border } = cellColor(data?.ratio);

  const tooltipContent = data ? (
    <Box sx={{ p: 0.5 }}>
      <Box fontWeight="bold" mb={0.5}>{dateKey} — {step.label}</Box>
      <Box>완료율: <strong>{data.ratio}%</strong></Box>
      <Box>수집: {fmt(data.count)} / {fmt(step.total)}</Box>
      <Box>미수집: {fmt(data.missing)}</Box>
    </Box>
  ) : (
    <Box sx={{ p: 0.5 }}>
      <Box fontWeight="bold" mb={0.5}>{dateKey} — {step.label}</Box>
      <Box>데이터 없음</Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="top" arrow>
      <Box
        sx={{
          width: 64,
          height: 52,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: bg,
          border: `1px solid ${border || "#e0e0e0"}`,
          borderRadius: 1,
          cursor: "default",
          transition: "transform 0.1s, box-shadow 0.1s",
          "&:hover": {
            transform: "scale(1.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            zIndex: 1,
            position: "relative",
          },
        }}
      >
        {data ? (
          <MKTypography variant="caption" fontWeight="bold" sx={{ color: text, lineHeight: 1.2 }}>
            {data.ratio}%
          </MKTypography>
        ) : (
          <MKTypography variant="caption" sx={{ color: "#bbb" }}>—</MKTypography>
        )}
      </Box>
    </Tooltip>
  );
}

const LABEL_W = 140; // 스텝 레이블 고정 너비(px)
const CELL_W  = 68;  // 날짜 셀 고정 너비(px)

function PipelineGrid({ grid }) {
  if (!grid || !grid.dates || grid.dates.length === 0)
    return <Alert severity="info">조회된 데이터가 없습니다.</Alert>;

  const { dates, steps } = grid;

  return (
    <Box>
      {/* 범례 */}
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <MKTypography variant="caption" color="text.secondary">완료율 범례:</MKTypography>
        {[
          { label: "≥ 95%", bg: "#e8f5e9", border: "#a5d6a7", text: "#2e7d32" },
          { label: "≥ 70%", bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
          { label: "< 70%", bg: "#ffebee", border: "#ef9a9a", text: "#c62828" },
          { label: "없음",  bg: "#f0f0f0", border: "#e0e0e0", text: "#aaa"    },
        ].map(({ label, bg, border, text }) => (
          <Box key={label} display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 14, height: 14, bgcolor: bg, border: `1px solid ${border}`, borderRadius: 0.5 }} />
            <MKTypography variant="caption" sx={{ color: text }}>{label}</MKTypography>
          </Box>
        ))}
      </Box>

      {/* 격자 본체 */}
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ display: "inline-block", minWidth: LABEL_W + CELL_W * dates.length }}>

          {/* ── 헤더 행 ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              bgcolor: "#f0f2f5",
              borderRadius: "8px 8px 0 0",
              borderBottom: "2px solid #c5cad4",
              pb: 1,
              pt: 0.5,
            }}
          >
            {/* 코너 셀 */}
            <Box
              sx={{
                width: LABEL_W,
                minWidth: LABEL_W,
                maxWidth: LABEL_W,
                flexShrink: 0,
                px: 1.5,
                borderRight: "2px solid #c5cad4",
              }}
            >
              <MKTypography variant="caption" fontWeight="bold" color="text.secondary">
                단계 \ 날짜
              </MKTypography>
            </Box>

            {/* 날짜 열 헤더 */}
            {dates.map((d) => (
              <Box
                key={d}
                sx={{
                  width: CELL_W,
                  minWidth: CELL_W,
                  maxWidth: CELL_W,
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <MKTypography
                  variant="caption"
                  fontWeight="medium"
                  color="text.secondary"
                  sx={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {d.slice(5)}
                </MKTypography>
              </Box>
            ))}
          </Box>

          {/* ── 바디 행 ── */}
          {steps.map((step, si) => (
            <Box
              key={step.key}
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: si % 2 === 0 ? "#ffffff" : "#f8f9fb",
                borderBottom: si < steps.length - 1 ? "1px solid #ebebeb" : "none",
                "&:last-child": { borderRadius: "0 0 8px 8px" },
                py: 1,
              }}
            >
              {/* 스텝 레이블 */}
              <Box
                sx={{
                  width: LABEL_W,
                  minWidth: LABEL_W,
                  maxWidth: LABEL_W,
                  flexShrink: 0,
                  px: 1.5,
                  borderRight: "2px solid #c5cad4",
                }}
              >
                <MKTypography variant="caption" fontWeight="bold" display="block">
                  {step.label}
                </MKTypography>
                <MKTypography variant="caption" color="text.secondary">
                  전체 {fmt(step.total)}
                </MKTypography>
              </Box>

              {/* 데이터 셀들 */}
              {dates.map((d) => (
                <Box
                  key={d}
                  sx={{
                    width: CELL_W,
                    minWidth: CELL_W,
                    maxWidth: CELL_W,
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <GridCell dateKey={d} step={step} />
                </Box>
              ))}
            </Box>
          ))}

        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Tab 3: 프로세스 & 로그
// ─────────────────────────────────────────────
function ProcessStatus({ processes }) {
  if (!processes || processes.length === 0) return null;
  return (
    <Box mb={2} display="flex" gap={2} flexWrap="wrap">
      {processes.map((p) => (
        <Chip
          key={p.name}
          label={
            p.running
              ? `🟢 ${p.name}  PID:${p.pid}  경과:${p.elapsed}  CPU:${p.cpu_percent}%`
              : `🔴 ${p.name}  (종료됨)`
          }
          color={p.running ? "success" : "default"}
          variant="outlined"
          size="small"
        />
      ))}
    </Box>
  );
}

function LogViewer({ source, autoRefresh }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logBoxRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${apiBase}/api/data-status/logs?source=${source}&lines=200`
      );
      if (!res.ok) throw new Error("로그 조회 실패");
      const data = await res.json();
      setLines(data.lines || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [source]);

  // 로그 하단으로 자동 스크롤
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [fetchLogs, autoRefresh]);

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {loading && lines.length === 0 && <CircularProgress size={20} />}
      <Box
        ref={logBoxRef}
        sx={{
          bgcolor: "#1e1e1e",
          color: "#d4d4d4",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          p: 2,
          borderRadius: 1,
          height: 420,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {lines.length === 0 ? (
          <span style={{ color: "#888" }}>로그가 없습니다.</span>
        ) : (
          lines.map((line, i) => {
            const color = line.includes("오류") || line.includes("Error")
              ? "#f48771"
              : line.includes("완료") || line.includes("success")
              ? "#4ec9b0"
              : "#d4d4d4";
            return (
              <div key={i} style={{ color }}>
                {line}
              </div>
            );
          })
        )}
      </Box>
    </>
  );
}

// ─────────────────────────────────────────────
// Tab 4: 데이터 수집 (수동 트리거)
// ─────────────────────────────────────────────

// 로컬 시간 기준 YYYY-MM-DD 반환 (toISOString은 UTC 변환으로 D-1 버그 발생)
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const TODAY = toLocalDateStr(new Date());
const ONE_WEEK_AGO = toLocalDateStr(new Date(Date.now() - 7 * 86400000));

// 일간 전체 파이프라인에서 실행되는 단계 목록 (표시용)
const PIPELINE_STEPS = [
  { key: "index_list",        icon: "1", label: "인덱스 목록 수집",      desc: "getAndSave_index_list" },
  { key: "stock_description", icon: "2", label: "주식 설명 수집",        desc: "getAndSave_stock_description" },
  { key: "index_data",        icon: "3", label: "인덱스 OHLCV 수집",    desc: "getAndSave_index_data" },
  { key: "stock_data",        icon: "4", label: "주식 OHLCV 수집",      desc: "getAndSave_stock_data (KIS API 우선)" },
  { key: "stock_analysis",    icon: "5", label: "주식 기술적 분석 계산", desc: "calculate_stock_analysis" },
  { key: "dart_data",         icon: "6", label: "DART 재무제표 수집",    desc: "getAndSave_stock_dartData (약 1시간, 선택)" },
];

function DailyPipelinePanel({ processes, onTriggerDone }) {
  const [expanded, setExpanded] = useState(false);
  const [skipDart, setSkipDart] = useState(true);
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isRunning = processes.some((p) => p.running && p.name?.includes("daily"));

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/api/data-status/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "daily",
          start_date: startDate,
          end_date: endDate,
          skip_dart: skipDart,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) onTriggerDone("daily");
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
      elevation={3}
      sx={{
        mb: 3,
        border: "2px solid",
        borderColor: "primary.main",
        borderRadius: "12px !important",
        "&:before": { display: "none" },
      }}
    >
      {/* ── 헤더 ── */}
      <AccordionSummary
        expandIcon={<span style={{ fontSize: 20 }}>▼</span>}
        sx={{ bgcolor: "primary.main", borderRadius: expanded ? "10px 10px 0 0" : "10px", px: 3, py: 1 }}
      >
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <MKTypography variant="h6" fontWeight="bold" color="white">
            ⚡ 일간 전체 파이프라인
          </MKTypography>
          {isRunning && (
            <Chip label="실행 중" size="small" sx={{ bgcolor: "#4caf50", color: "white" }} />
          )}
          <MKTypography variant="body2" color="white" sx={{ opacity: 0.85, ml: "auto", mr: 2 }}>
            수집 → 가공 전 과정을 순서대로 한번에 실행
          </MKTypography>
        </Box>
      </AccordionSummary>

      {/* ── 상세 내용 ── */}
      <AccordionDetails sx={{ p: 3 }}>
        {/* 단계 목록 */}
        <Box mb={2.5}>
          {PIPELINE_STEPS.map((step, idx) => {
            const isSkipped = step.key === "dart_data" && skipDart;
            return (
              <Box key={step.key}>
                <Box display="flex" alignItems="center" gap={1.5} py={0.75}>
                  <Box
                    sx={{
                      width: 24, height: 24, borderRadius: "50%",
                      bgcolor: isSkipped ? "#bdbdbd" : "primary.main",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MKTypography variant="caption" color="white" fontWeight="bold">
                      {step.icon}
                    </MKTypography>
                  </Box>
                  <Box flex={1}>
                    <MKTypography
                      variant="body2"
                      fontWeight="medium"
                      color={isSkipped ? "text.disabled" : "text.primary"}
                    >
                      {step.label}
                      {isSkipped && (
                        <Chip label="건너뜀" size="small" sx={{ ml: 1, height: 18, fontSize: "0.65rem" }} />
                      )}
                    </MKTypography>
                    <MKTypography variant="caption" color="text.secondary">
                      {step.desc}
                    </MKTypography>
                  </Box>
                </Box>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <Box ml={1.5} pl={2.5} sx={{ borderLeft: "2px dashed #e0e0e0", height: 8 }} />
                )}
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 날짜 선택 */}
        <Box display="flex" alignItems="flex-end" gap={2} mb={2} flexWrap="wrap">
          <Box minWidth={150}>
            <MKTypography variant="caption" color="text.secondary">시작일</MKTypography>
            <MKDatePicker
              value={startDate}
              options={{ dateFormat: "Y-m-d", maxDate: endDate, allowInput: true }}
              onChange={([d]) => d && setStartDate(toLocalDateStr(d))}
              input={{ placeholder: "시작일 선택", size: "small" }}
            />
          </Box>
          <Box minWidth={150}>
            <MKTypography variant="caption" color="text.secondary">종료일</MKTypography>
            <MKDatePicker
              value={endDate}
              options={{ dateFormat: "Y-m-d", minDate: startDate, maxDate: TODAY, allowInput: true }}
              onChange={([d]) => d && setEndDate(toLocalDateStr(d))}
              input={{ placeholder: "종료일 선택", size: "small" }}
            />
          </Box>
        </Box>

        {/* 옵션 + 실행 버튼 */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={skipDart}
                onChange={(e) => setSkipDart(e.target.checked)}
                size="small"
                color="warning"
              />
            }
            label={
              <MKTypography variant="body2">
                DART 재무제표 건너뜀
                <MKTypography component="span" variant="caption" color="text.secondary" ml={0.5}>
                  (약 1시간 절약)
                </MKTypography>
              </MKTypography>
            }
          />
          <MKButton
            variant="gradient"
            color="info"
            onClick={handleTrigger}
            disabled={loading || isRunning}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : "전체 파이프라인 실행"}
          </MKButton>
        </Box>

        {result && (
          <Alert
            severity={result.success ? "success" : "error"}
            sx={{ mt: 2 }}
            onClose={() => setResult(null)}
          >
            {result.message}
            {result.success && (
              <MKTypography variant="caption" display="block" mt={0.5}>
                실시간 로그 탭에서 진행 상황을 확인할 수 있습니다.
              </MKTypography>
            )}
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

const TASK_CONFIG = [
  {
    task: "ohlcv",
    label: "OHLCV 원천데이터",
    description: "주식 일별 시고저종 데이터 수집",
    icon: "📈",
    needsDate: true,
    logSource: "ohlcv",
    color: "info",
  },
  {
    task: "index",
    label: "인덱스 데이터",
    description: "KOSPI / KOSDAQ 등 시장 지수 수집",
    icon: "📊",
    needsDate: true,
    logSource: "index",
    color: "info",
  },
  {
    task: "analysis",
    label: "기술적 분석",
    description: "이동평균, RS, 미너비니 등 계산",
    icon: "🔬",
    needsDate: true,
    logSource: "analysis",
    color: "warning",
  },
  {
    task: "financial",
    label: "재무제표",
    description: "DART 재무제표 데이터 수집 (전체 종목, 약 1시간)",
    icon: "📋",
    needsDate: false,
    logSource: "dart",
    color: "error",
  },
];

function CollectionPanel({ config, processes, onTriggerDone }) {
  const [startDate, setStartDate] = useState(ONE_WEEK_AGO);
  const [endDate, setEndDate] = useState(TODAY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isRunning = processes.some(
    (p) => p.running && p.name.includes(config.task === "financial" ? "재무제표" : config.label)
  );

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body = { task: config.task };
      if (config.needsDate) {
        body.start_date = startDate;
        body.end_date = endDate;
      }
      const res = await fetch(`${apiBase}/api/data-status/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) onTriggerDone(data.log_source);
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 1.5, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
        {/* 좌측: 아이콘 + 설명 */}
        <Box flex={1} minWidth={180}>
          <MKTypography variant="body1" fontWeight="bold">
            {config.icon} {config.label}
            {isRunning && (
              <Chip label="실행 중" color="success" size="small" sx={{ ml: 1 }} />
            )}
          </MKTypography>
          <MKTypography variant="caption" color="text.secondary">
            {config.description}
          </MKTypography>
        </Box>

        {/* 우측: 날짜 선택 + 실행 버튼 */}
        <Box display="flex" alignItems="flex-end" gap={2} flexWrap="wrap">
          {config.needsDate && (
            <>
              <Box minWidth={140}>
                <MKTypography variant="caption" color="text.secondary">시작일</MKTypography>
                <MKDatePicker
                  value={startDate}
                  options={{ dateFormat: "Y-m-d", maxDate: endDate, allowInput: true }}
                  onChange={([d]) => d && setStartDate(toLocalDateStr(d))}
                  input={{ placeholder: "시작일 선택", size: "small" }}
                />
              </Box>
              <Box minWidth={140}>
                <MKTypography variant="caption" color="text.secondary">종료일</MKTypography>
                <MKDatePicker
                  value={endDate}
                  options={{ dateFormat: "Y-m-d", minDate: startDate, maxDate: TODAY, allowInput: true }}
                  onChange={([d]) => d && setEndDate(toLocalDateStr(d))}
                  input={{ placeholder: "종료일 선택", size: "small" }}
                />
              </Box>
            </>
          )}
          <Box mt={config.needsDate ? 2.5 : 0}>
            <MKButton
              variant="gradient"
              color={config.color}
              size="small"
              onClick={handleTrigger}
              disabled={loading || isRunning}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : "수집 시작"}
            </MKButton>
          </Box>
        </Box>
      </Box>

      {result && (
        <Alert
          severity={result.success ? "success" : "error"}
          sx={{ mt: 1 }}
          onClose={() => setResult(null)}
        >
          {result.message}
        </Alert>
      )}
    </Box>
  );
}

function CollectionTab({ processes, onLogSourceChange }) {
  const [individualExpanded, setIndividualExpanded] = useState(false);

  return (
    <Box>
      {/* ── 일간 전체 파이프라인 ── */}
      <DailyPipelinePanel
        processes={processes}
        onTriggerDone={(src) => onLogSourceChange(src)}
      />

      {/* ── 개별 단계 실행 (아코디언) ── */}
      <Accordion
        expanded={individualExpanded}
        onChange={(_, v) => setIndividualExpanded(v)}
        elevation={2}
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: "12px !important",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<span style={{ fontSize: 16 }}>▼</span>}
          sx={{ px: 3, py: 1 }}
        >
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <MKTypography variant="h6" fontWeight="bold">
              🔧 개별 단계 실행
            </MKTypography>
            <MKTypography variant="body2" color="text.secondary" sx={{ ml: "auto", mr: 1 }}>
              특정 단계만 선택해서 실행
            </MKTypography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <MKTypography variant="caption" color="text.secondary" display="block" mb={1.5}>
            수집 후 <strong>실시간 로그</strong> 탭에서 진행 상황을 확인할 수 있습니다.
          </MKTypography>
          {TASK_CONFIG.map((config) => (
            <CollectionPanel
              key={config.task}
              config={config}
              processes={processes}
              onTriggerDone={onLogSourceChange}
            />
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
function DataManagement() {
  const [tab, setTab] = useState(0);

  // Tab 1 데이터
  const [summary, setSummary] = useState(null);
  const [analysisGap, setAnalysisGap] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Tab 2 데이터
  const [pipelineGrid, setPipelineGrid] = useState(null);
  const [gapDays, setGapDays] = useState(30);
  const [gapsLoading, setGapsLoading] = useState(false);

  // Tab 3 데이터
  const [processes, setProcesses] = useState([]);
  const [logSource, setLogSource] = useState("dart");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const processIntervalRef = useRef(null);

  // ── Summary 조회
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [sumRes, gapRes] = await Promise.all([
        fetch(`${apiBase}/api/data-status/summary`),
        fetch(`${apiBase}/api/data-status/analysis-gap`),
      ]);
      setSummary(await sumRes.json());
      setAnalysisGap(await gapRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Pipeline Grid 조회
  const fetchGaps = useCallback(async () => {
    setGapsLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/data-status/pipeline-grid?days=${gapDays}`
      );
      setPipelineGrid(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setGapsLoading(false);
    }
  }, [gapDays]);

  // ── Processes 조회
  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/data-status/processes`);
      setProcesses(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Tab 전환 시 데이터 로드
  useEffect(() => {
    if (tab === 0) fetchSummary();
    if (tab === 1) fetchGaps();
    if (tab === 2 || tab === 3) {
      fetchProcesses();
      processIntervalRef.current = setInterval(fetchProcesses, 10000);
    }
    return () => clearInterval(processIntervalRef.current);
  }, [tab, fetchSummary, fetchGaps, fetchProcesses]);

  // gapDays 변경 시 재조회
  useEffect(() => {
    if (tab === 1) fetchGaps();
  }, [gapDays, tab, fetchGaps]);

  return (
    <>
      <DefaultNavbar routes={routes} sticky />
      <MKBox minHeight="100vh" pt={10} pb={4} sx={{ bgcolor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <MKTypography variant="h4" fontWeight="bold" mb={1}>
            데이터 관리
          </MKTypography>
          <MKTypography variant="body2" color="text.secondary" mb={3}>
            원천데이터 수집 현황 · 빈 구간 조회 · 실시간 로그
          </MKTypography>

          <Card elevation={1}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: "1px solid #e0e0e0", px: 2 }}
            >
              <Tab label="데이터 현황" />
              <Tab label="날짜별 빈 구간" />
              <Tab label="실시간 로그" />
              <Tab label="데이터 수집" />
            </Tabs>

            <Box p={3}>
              {/* ── Tab 1: 데이터 현황 ── */}
              <TabPanel value={tab} index={0}>
                {summaryLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : summary ? (
                  <>
                    <Grid container spacing={3} mb={3}>
                      <Grid item xs={12} md={4}>
                        <SummaryCard
                          title="OHLCV 원천데이터"
                          done={summary.ohlcv_done}
                          total={summary.total_companies}
                          records={summary.ohlcv_total_records}
                          latestDate={summary.ohlcv_latest_date}
                          extra={
                            summary.ohlcv_oldest_date
                              ? `수집 기간: ${summary.ohlcv_oldest_date} ~`
                              : null
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <SummaryCard
                          title="기술적 분석"
                          done={summary.analysis_done}
                          total={summary.total_companies}
                          records={summary.analysis_total_records}
                          latestDate={summary.analysis_latest_date}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <SummaryCard
                          title="재무제표"
                          done={summary.financial_done}
                          total={summary.total_companies}
                          records={summary.financial_total_records}
                          extra={
                            summary.financial_latest_year
                              ? `최신 분기: ${summary.financial_latest_year} ${summary.financial_latest_quarter}`
                              : "수집 없음"
                          }
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <AnalysisGapCard gap={analysisGap} />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Card elevation={2}>
                          <CardContent>
                            <MKTypography variant="h6" fontWeight="bold" mb={1}>
                              전체 현황 요약
                            </MKTypography>
                            <MKTypography variant="body2" color="text.secondary">
                              전체 KR 종목 수: <strong>{fmt(summary.total_companies)}</strong>개
                            </MKTypography>
                            <MKTypography variant="body2" color="text.secondary" mt={0.5}>
                              OHLCV 미수집:{" "}
                              <strong>
                                {fmt(summary.total_companies - summary.ohlcv_done)}
                              </strong>종목
                            </MKTypography>
                            <MKTypography variant="body2" color="text.secondary" mt={0.5}>
                              분석 미계산:{" "}
                              <strong>
                                {fmt(summary.total_companies - summary.analysis_done)}
                              </strong>종목
                            </MKTypography>
                            <MKTypography variant="body2" color="text.secondary" mt={0.5}>
                              재무제표 미수집:{" "}
                              <strong>
                                {fmt(summary.total_companies - summary.financial_done)}
                              </strong>종목
                            </MKTypography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <Alert severity="warning">데이터를 불러올 수 없습니다.</Alert>
                )}
              </TabPanel>

              {/* ── Tab 2: 날짜별 빈 구간 ── */}
              <TabPanel value={tab} index={1}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <MKTypography variant="body2">조회 기간:</MKTypography>
                  <Select
                    value={gapDays}
                    onChange={(e) => setGapDays(e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={10}>최근 10일</MenuItem>
                    <MenuItem value={30}>최근 30일</MenuItem>
                    <MenuItem value={60}>최근 60일</MenuItem>
                    <MenuItem value={90}>최근 90일</MenuItem>
                  </Select>
                </Box>
                {gapsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <PipelineGrid grid={pipelineGrid} />
                )}
              </TabPanel>

              {/* ── Tab 4: 데이터 수집 ── */}
              <TabPanel value={tab} index={3}>
                <CollectionTab
                  processes={processes}
                  onLogSourceChange={(src) => {
                    setLogSource(src);
                    setTab(2);  // 로그 탭으로 자동 이동
                    setAutoRefresh(true);
                  }}
                />
              </TabPanel>

              {/* ── Tab 3: 실시간 로그 ── */}
              <TabPanel value={tab} index={2}>
                <ProcessStatus processes={processes} />

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <MKTypography variant="body2">로그 선택:</MKTypography>
                  <Select
                    value={logSource}
                    onChange={(e) => setLogSource(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="daily">일간 전체 파이프라인 로그</MenuItem>
                    <MenuItem value="ohlcv">OHLCV 수집 로그</MenuItem>
                    <MenuItem value="index">인덱스 수집 로그</MenuItem>
                    <MenuItem value="analysis">기술적 분석 로그</MenuItem>
                    <MenuItem value="dart">재무제표 수집 로그</MenuItem>
                    <MenuItem value="server">서버 로그</MenuItem>
                  </Select>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        size="small"
                      />
                    }
                    label={
                      <MKTypography variant="body2">
                        자동 갱신 (5초){autoRefresh ? " ON" : " OFF"}
                      </MKTypography>
                    }
                  />
                </Box>

                <LogViewer source={logSource} autoRefresh={autoRefresh} />
              </TabPanel>
            </Box>
          </Card>
        </Container>
      </MKBox>
      <MKBox pt={6} px={1} mt="auto">
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default DataManagement;
