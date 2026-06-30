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
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";

const API_BASE = () => window.REACT_APP_API_BASE_URL || "http://localhost:8000";

async function fetchInvestorData(endpoint, stockCode) {
  const res = await fetch(`${API_BASE()}/api/stock/${stockCode}/${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "데이터 조회 실패");
  return { data: json.data, isMarketClosed: json.is_market_closed };
}

function formatNumber(val) {
  if (val === undefined || val === null || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return val;
  return n.toLocaleString("ko-KR");
}

function NetChip({ value }) {
  const n = Number(value);
  if (isNaN(n) || n === 0) return <Typography variant="body2">{formatNumber(value)}</Typography>;
  return (
    <Chip
      label={formatNumber(value)}
      size="small"
      sx={{
        backgroundColor: n > 0 ? "rgba(255, 82, 82, 0.15)" : "rgba(33, 150, 243, 0.15)",
        color: n > 0 ? "#ff5252" : "#2196f3",
        fontWeight: 600,
        fontSize: "0.75rem",
      }}
    />
  );
}

function MarketClosedAlert() {
  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      장 운영 시간이 아닙니다. 매매동향 데이터는 <strong>평일 09:00 ~ 15:30</strong> 사이에만 제공됩니다.
    </Alert>
  );
}

// ─── 탭 1: 당일 투자자별 순매수 (외국인/기관/개인) ───────────────────────
const INVESTOR_LABELS = ["개인", "외국인", "기관계", "금융투자", "보험", "투신", "기타금융", "은행", "연기금", "사모펀드", "국가", "기타법인", "내외국인"];

function InvestorTodayTab({ stockCode }) {
  const [data, setData] = useState(null);
  const [isMarketClosed, setIsMarketClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInvestorData("investor-today", stockCode);
      setData(result.data);
      setIsMarketClosed(result.isMarketClosed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (isMarketClosed) return <MarketClosedAlert />;
  if (!data?.output2?.length) return <Alert severity="info" sx={{ mt: 2 }}>데이터가 없습니다.</Alert>;

  const rows = data.output2;

  return (
    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>투자자</TableCell>
            <TableCell align="right">매도수량</TableCell>
            <TableCell align="right">매수수량</TableCell>
            <TableCell align="right">순매수수량</TableCell>
            <TableCell align="right">매도금액</TableCell>
            <TableCell align="right">매수금액</TableCell>
            <TableCell align="right">순매수금액</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {INVESTOR_LABELS[idx] ?? `투자자${idx + 1}`}
              </TableCell>
              <TableCell align="right">{formatNumber(row.seln_rsqn)}</TableCell>
              <TableCell align="right">{formatNumber(row.shnu_rsqn)}</TableCell>
              <TableCell align="right"><NetChip value={row.ntby_rsqn} /></TableCell>
              <TableCell align="right">{formatNumber(row.seln_amt)}</TableCell>
              <TableCell align="right">{formatNumber(row.shnu_amt)}</TableCell>
              <TableCell align="right"><NetChip value={row.ntby_amt} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── 탭 2: 외국인/기관 당일 가집계 시간대별 ─────────────────────────────────
function ForeignTotalTab({ stockCode }) {
  const [data, setData] = useState(null);
  const [isMarketClosed, setIsMarketClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInvestorData("foreign-total", stockCode);
      setData(result.data);
      setIsMarketClosed(result.isMarketClosed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (isMarketClosed) return <MarketClosedAlert />;
  if (!data?.output2?.length) return <Alert severity="info" sx={{ mt: 2 }}>데이터가 없습니다.</Alert>;

  const rows = data.output2;

  return (
    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>시간</TableCell>
            <TableCell align="right">외국인 순매수(주)</TableCell>
            <TableCell align="right">기관 순매수(주)</TableCell>
            <TableCell align="right">외국인 누적</TableCell>
            <TableCell align="right">기관 누적</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ fontWeight: 500 }}>{row.stck_cntg_hour || row.hts_hour || "-"}</TableCell>
              <TableCell align="right"><NetChip value={row.frgn_ntby_qty ?? row.frgn_seln_vol} /></TableCell>
              <TableCell align="right"><NetChip value={row.orgn_ntby_qty ?? row.orgn_seln_vol} /></TableCell>
              <TableCell align="right">{formatNumber(row.frgn_ntby_qty_icdc)}</TableCell>
              <TableCell align="right">{formatNumber(row.orgn_ntby_qty_icdc)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── 탭 3: 프로그램 매매 추이 ────────────────────────────────────────────────
function ProgramTradeTab({ stockCode }) {
  const [data, setData] = useState(null);
  const [isMarketClosed, setIsMarketClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInvestorData("program-trade", stockCode);
      setData(result.data);
      setIsMarketClosed(result.isMarketClosed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (isMarketClosed) return <MarketClosedAlert />;
  if (!data?.output2?.length) return <Alert severity="info" sx={{ mt: 2 }}>데이터가 없습니다.</Alert>;

  const rows = data.output2;

  return (
    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>시간</TableCell>
            <TableCell align="right">매도(주)</TableCell>
            <TableCell align="right">매수(주)</TableCell>
            <TableCell align="right">순매수(주)</TableCell>
            <TableCell align="right">매도금액</TableCell>
            <TableCell align="right">매수금액</TableCell>
            <TableCell align="right">순매수금액</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ fontWeight: 500 }}>{row.stck_cntg_hour || row.hts_hour || "-"}</TableCell>
              <TableCell align="right">{formatNumber(row.whol_smtn_seln_qty ?? row.pgm_seln_qty)}</TableCell>
              <TableCell align="right">{formatNumber(row.whol_smtn_shnu_qty ?? row.pgm_shnu_qty)}</TableCell>
              <TableCell align="right"><NetChip value={row.whol_smtn_ntby_qty ?? row.pgm_ntby_qty} /></TableCell>
              <TableCell align="right">{formatNumber(row.whol_smtn_seln_amt ?? row.pgm_seln_amt)}</TableCell>
              <TableCell align="right">{formatNumber(row.whol_smtn_shnu_amt ?? row.pgm_shnu_amt)}</TableCell>
              <TableCell align="right"><NetChip value={row.whol_smtn_ntby_amt ?? row.pgm_ntby_amt} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── 탭 4: 전 증권사 회원사별 매매동향 ──────────────────────────────────────
function MemberFirmTab({ stockCode }) {
  const [data, setData] = useState(null);
  const [isMarketClosed, setIsMarketClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInvestorData("member-firm", stockCode);
      setData(result.data);
      setIsMarketClosed(result.isMarketClosed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (isMarketClosed) return <MarketClosedAlert />;
  if (!data?.output2?.length) return <Alert severity="info" sx={{ mt: 2 }}>데이터가 없습니다.</Alert>;

  const rows = data.output2;

  return (
    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 440 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>증권사</TableCell>
            <TableCell align="right">매도(주)</TableCell>
            <TableCell align="right">매수(주)</TableCell>
            <TableCell align="right">순매수(주)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx} hover>
              <TableCell sx={{ fontWeight: 500 }}>{row.mbcr_name || "-"}</TableCell>
              <TableCell align="right">{formatNumber(row.seln_qty ?? row.seln_mbcr_rlim)}</TableCell>
              <TableCell align="right">{formatNumber(row.shnu_qty ?? row.shnu_mbcr_rlim)}</TableCell>
              <TableCell align="right"><NetChip value={row.ntby_qty ?? row.ntby_mbcr_rlim} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
    { label: "투자자별 순매수", component: <InvestorTodayTab stockCode={stockCode} /> },
    { label: "외국인/기관 시간대별", component: <ForeignTotalTab stockCode={stockCode} /> },
    { label: "프로그램 매매", component: <ProgramTradeTab stockCode={stockCode} /> },
    { label: "증권사별 매매", component: <MemberFirmTab stockCode={stockCode} /> },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
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
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} />
          ))}
        </Tabs>
        {tabs[tab].component}
      </DialogContent>
    </Dialog>
  );
}
