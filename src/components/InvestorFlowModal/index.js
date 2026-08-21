import { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import FlowTable from "./FlowTable";
import { COLORS, alpha } from "constants/styles";

const API_BASE = () => window.REACT_APP_API_BASE_URL || "http://localhost:8000";
const RIGHT_ALIGN = { justifyContent: "flex-end" };

async function fetchInvestorData(endpoint, stockCode) {
  const res = await fetch(`${API_BASE()}/api/stock/${stockCode}/${endpoint}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || `조회 실패 (HTTP ${res.status})`);
  return { data: json.data, isMarketClosed: json.is_market_closed };
}

/** 매매동향 엔드포인트 조회 상태를 관리하는 공통 훅. */
function useInvestorData(endpoint, stockCode) {
  const [state, setState] = useState({
    data: null,
    isMarketClosed: false,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState({ data: null, isMarketClosed: false, loading: true, error: null });
    try {
      const result = await fetchInvestorData(endpoint, stockCode);
      setState({
        data: result.data,
        isMarketClosed: result.isMarketClosed,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({ data: null, isMarketClosed: false, loading: false, error: e.message });
    }
  }, [endpoint, stockCode]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}

function formatNumber(val) {
  if (val === undefined || val === null || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return val;
  return n.toLocaleString("ko-KR");
}

function formatPercent(val) {
  const n = Number(val);
  if (isNaN(n)) return "-";
  return `${n.toFixed(2)}%`;
}

/** YYYYMMDD → MM/DD */
function formatDate(val) {
  if (!val || val.length !== 8) return val || "-";
  return `${val.slice(4, 6)}/${val.slice(6, 8)}`;
}

/** HHMMSS → HH:MM:SS */
function formatTime(val) {
  if (!val || val.length !== 6) return val || "-";
  return `${val.slice(0, 2)}:${val.slice(2, 4)}:${val.slice(4, 6)}`;
}

function NetChip({ value }) {
  const n = Number(value);
  if (isNaN(n) || n === 0) return <Typography variant="body2">{formatNumber(value)}</Typography>;
  return (
    <Chip
      label={formatNumber(value)}
      size="small"
      sx={{
        backgroundColor: n > 0 ? "rgba(255, 82, 82, 0.15)" : alpha(COLORS.DOWN, 0.15),
        color: n > 0 ? "#ff5252" : COLORS.DOWN,
        fontWeight: 600,
        fontSize: "0.75rem",
      }}
    />
  );
}

/** 숫자 컬럼 정의를 만든다. net=true 면 순매수 색상 칩으로 렌더한다. */
function numberColumn(name, field, { net = false, width } = {}) {
  return {
    name,
    selector: (row) => row[field],
    style: RIGHT_ALIGN,
    width,
    cell: net
      ? (row) => <NetChip value={row[field]} />
      : (row) => <span>{formatNumber(row[field])}</span>,
  };
}

/** 로딩/에러/빈 데이터 상태를 공통 처리하고, 정상일 때만 children 을 렌더한다. */
function DataState({ loading, error, isEmpty, emptyMessage, children }) {
  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  if (isEmpty)
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {emptyMessage}
      </Alert>
    );
  return children;
}

// ─── 탭 1: 일자별 투자자 순매수 (개인/외국인/기관) ──────────────────────────
const INVESTOR_COLUMNS = [
  {
    name: "일자",
    selector: (row) => row.date,
    cell: (row) => <strong>{formatDate(row.date)}</strong>,
    width: "80px",
  },
  numberColumn("종가", "close"),
  numberColumn("전일대비", "change", { net: true }),
  numberColumn("개인(주)", "prsn_qty", { net: true }),
  numberColumn("외국인(주)", "frgn_qty", { net: true }),
  numberColumn("기관(주)", "orgn_qty", { net: true }),
  numberColumn("개인(백만)", "prsn_amt"),
  numberColumn("외국인(백만)", "frgn_amt"),
  numberColumn("기관(백만)", "orgn_amt"),
];

function InvestorTodayTab({ stockCode }) {
  const { data, loading, error } = useInvestorData("investor-today", stockCode);
  const rows = data?.rows ?? [];

  return (
    <DataState
      loading={loading}
      error={error}
      isEmpty={rows.length === 0}
      emptyMessage="투자자별 순매수 데이터가 없습니다."
    >
      <>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          당일 순매수는 장 마감 후 확정되며, 장중에는 0으로 표시될 수 있습니다.
        </Typography>
        <FlowTable columns={INVESTOR_COLUMNS} data={rows} minWidth="900px" />
      </>
    </DataState>
  );
}

// ─── 탭 2: 프로그램 매매 추이 ────────────────────────────────────────────────
const PROGRAM_COLUMNS = [
  {
    name: "시간",
    selector: (row) => row.time,
    cell: (row) => <strong>{formatTime(row.time)}</strong>,
    width: "100px",
  },
  numberColumn("현재가", "price"),
  {
    name: "등락률",
    selector: (row) => row.change_rate,
    style: RIGHT_ALIGN,
    cell: (row) => <span>{formatPercent(row.change_rate)}</span>,
  },
  numberColumn("매도(주)", "seln_vol"),
  numberColumn("매수(주)", "shnu_vol"),
  numberColumn("순매수(주)", "ntby_qty", { net: true }),
  numberColumn("순매수금액", "ntby_amt", { net: true }),
];

function ProgramTradeTab({ stockCode }) {
  const { data, isMarketClosed, loading, error } = useInvestorData("program-trade", stockCode);
  const rows = data?.rows ?? [];

  return (
    <DataState
      loading={loading}
      error={error}
      isEmpty={rows.length === 0}
      emptyMessage={
        isMarketClosed
          ? "프로그램 매매 시간대별 데이터는 장중(평일 09:00~15:30)에만 제공됩니다."
          : "프로그램 매매 데이터가 없습니다."
      }
    >
      <FlowTable columns={PROGRAM_COLUMNS} data={rows} minWidth="800px" />
    </DataState>
  );
}

// ─── 탭 3: 증권사별 매매 (매도/매수 상위 + 외국계 합계) ─────────────────────
const MEMBER_COLUMNS = [
  {
    name: "증권사",
    selector: (row) => row.name,
    grow: 1,
    cell: (row) => (
      <span>
        {row.name}
        {row.is_foreign && <Chip label="외국계" size="small" sx={{ ml: 1, fontSize: "0.65rem" }} />}
      </span>
    ),
  },
  numberColumn("수량(주)", "qty"),
  {
    name: "비중",
    selector: (row) => row.ratio,
    style: RIGHT_ALIGN,
    cell: (row) => <span>{formatPercent(row.ratio)}</span>,
  },
  numberColumn("직전대비", "change"),
];

function MemberFirmTab({ stockCode }) {
  const { data, loading, error } = useInvestorData("member-firm", stockCode);
  const sellRows = data?.sell ?? [];
  const buyRows = data?.buy ?? [];
  const foreign = data?.foreign;

  return (
    <DataState
      loading={loading}
      error={error}
      isEmpty={sellRows.length === 0 && buyRows.length === 0}
      emptyMessage="증권사별 매매 데이터가 없습니다."
    >
      <>
        {foreign && (
          <Alert severity="info" sx={{ mt: 2 }}>
            외국계 합계 — 매수 {formatNumber(foreign.shnu_qty)}주 (
            {formatPercent(foreign.shnu_ratio)}) / 매도 {formatNumber(foreign.seln_qty)}주 (
            {formatPercent(foreign.seln_ratio)}) / 순매수{" "}
            <strong>{formatNumber(foreign.ntby_qty)}주</strong>
          </Alert>
        )}
        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>
          매수 상위
        </Typography>
        <FlowTable columns={MEMBER_COLUMNS} data={buyRows} minWidth="520px" />
        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>
          매도 상위
        </Typography>
        <FlowTable columns={MEMBER_COLUMNS} data={sellRows} minWidth="520px" />
      </>
    </DataState>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────────────────
export default function InvestorFlowModal({ open, onClose, stockCode, stockName }) {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (open) setTab(0);
  }, [open, stockCode]);

  if (!stockCode) return null;

  const tabs = [
    { label: "일자별 투자자 순매수", component: <InvestorTodayTab stockCode={stockCode} /> },
    { label: "프로그램 매매", component: <ProgramTradeTab stockCode={stockCode} /> },
    { label: "증권사별 매매", component: <MemberFirmTab stockCode={stockCode} /> },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}
      >
        <Box>
          <Typography variant="h6" component="span" fontWeight={700}>
            매매동향
          </Typography>
          {stockName && (
            <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
              {stockName} ({stockCode})
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} />
          ))}
        </Tabs>
        {tabs[tab].component}
      </DialogContent>
    </Dialog>
  );
}
