import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import LightweightChart from "./LightweightChart";
import { COLORS } from "constants/styles";

const DAILY_LIMIT = 20000;
const DAILY_INITIAL_VISIBLE = 150;
const MINUTE_REFRESH_MS = 30 * 1000;

/** 정규장 여부 (09:00 ~ 15:30 KST) */
function isMarketHours() {
  const now = new Date();
  // KST = UTC+9
  const kstHour = (now.getUTCHours() + 9) % 24;
  const kstMin = now.getUTCMinutes();
  const kstTime = kstHour * 100 + kstMin;
  return kstTime >= 900 && kstTime < 1530;
}

function getApiBase() {
  return window.REACT_APP_API_BASE_URL || "http://localhost:8000";
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function mapMinuteRow(r) {
  // lightweight-charts는 timestamp를 UTC로 표시 → KST 시각을 "UTC인 척" 보내야 09:00이 그대로 보임
  const [datepart, timepart] = r.datetime.split(" ");
  const [y, m, d] = datepart.split("-").map(Number);
  const [hh, mm, ss] = timepart.split(":").map(Number);
  return {
    time: Math.floor(Date.UTC(y, m - 1, d, hh, mm, ss) / 1000),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  };
}

function StockChartModal({ open, onClose, stockCode, stockName }) {
  const [dailyData, setDailyData] = useState([]);
  const [minuteData, setMinuteData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [minuteLoading, setMinuteLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshTimerRef = useRef(null);
  const eventSourceRef = useRef(null);
  const minuteAccumRef = useRef([]);

  useEffect(() => {
    if (!open || !stockCode) return;

    let cancelled = false;
    const apiBase = getApiBase();

    const loadDaily = async () => {
      setDailyLoading(true);
      try {
        const res = await fetchJson(
          `${apiBase}/api/find_stock_ohlcv?code=${stockCode}&limit=${DAILY_LIMIT}`
        );
        const rows = res?.data || [];
        const mapped = rows.map((r) => ({
          time: r.date,
          open: Number(r.open),
          high: Number(r.high),
          low: Number(r.low),
          close: Number(r.close),
          volume: Number(r.volume),
        }));
        if (!cancelled) setDailyData(mapped);
      } catch (e) {
        if (!cancelled) setError(`일봉 데이터 로드 실패: ${e.message}`);
      } finally {
        if (!cancelled) setDailyLoading(false);
      }
    };

    const loadMinute = () => {
      // 기존 SSE 연결 종료
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      minuteAccumRef.current = [];
      setMinuteLoading(true);

      const source = new EventSource(`${apiBase}/api/find_stock_minute_stream?code=${stockCode}`);
      eventSourceRef.current = source;

      source.onmessage = (e) => {
        if (cancelled) {
          source.close();
          return;
        }
        const msg = JSON.parse(e.data);

        if (msg.status === "done") {
          source.close();
          eventSourceRef.current = null;
          setMinuteLoading(false);
          return;
        }

        if (msg.status === "error") {
          source.close();
          eventSourceRef.current = null;
          setError(`분봉 데이터 로드 실패: ${msg.message}`);
          setMinuteLoading(false);
          return;
        }

        if (msg.status === "ok" && msg.data) {
          const mapped = msg.data.map(mapMinuteRow);
          // 중복 제거(time 키 기준) + 시간 오름차순 정렬
          const merged = new Map(minuteAccumRef.current.map((b) => [b.time, b]));
          for (const b of mapped) merged.set(b.time, b);
          minuteAccumRef.current = [...merged.values()].sort((a, b) => a.time - b.time);
          setMinuteData([...minuteAccumRef.current]);
        }
      };

      source.onerror = () => {
        if (!cancelled) setMinuteLoading(false);
        source.close();
        eventSourceRef.current = null;
      };
    };

    const loadCurrentPrice = async () => {
      try {
        const res = await fetchJson(`${apiBase}/api/find_stock_current_price?code=${stockCode}`);
        if (!cancelled && res?.price) setCurrentPrice(res.price);
      } catch {
        // 현재가 실패는 무시 (분봉/일봉 데이터로 대체)
      }
    };

    setError(null);
    setDailyData([]);
    setMinuteData([]);
    setCurrentPrice(null);
    loadDaily();
    loadMinute();
    loadCurrentPrice();

    // 정규장 중 차트 오픈 시 백필 실행 (누락된 분봉 DB에 채움 → 30초 후 갱신 때 반영)
    if (isMarketHours()) {
      fetch(`${apiBase}/api/backfill_minute_ohlcv?code=${stockCode}`).catch(() => {
        // 백필 실패는 무시 (차트 데이터 자체는 SSE 또는 KIS 직접 조회로 제공)
      });
    }

    refreshTimerRef.current = setInterval(() => {
      loadMinute();
      loadCurrentPrice();
    }, MINUTE_REFRESH_MS);

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [open, stockCode]);

  // 일봉의 마지막 캔들을 현재가로 갱신 (오늘 진행중인 봉 반영)
  const dailyWithCurrent = (() => {
    if (!currentPrice || dailyData.length === 0) return dailyData;
    const last = dailyData[dailyData.length - 1];
    const today = new Date().toISOString().slice(0, 10);
    if (last.time !== today) return dailyData;
    return [
      ...dailyData.slice(0, -1),
      {
        ...last,
        close: currentPrice,
        high: Math.max(last.high, currentPrice),
        low: Math.min(last.low, currentPrice),
      },
    ];
  })();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { height: "85vh" } }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}
      >
        <Box display="flex" alignItems="baseline" gap={2}>
          <Typography variant="h6" fontWeight={700}>
            {stockName} ({stockCode})
          </Typography>
          {currentPrice && (
            <Typography variant="body1" color="text.secondary">
              현재가 {currentPrice.toLocaleString()}원
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, height: "100%" }}>
        {error && (
          <Box mb={1}>
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 2, height: "100%" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" mb={0.5}>
              일봉 (전체 {dailyData.length}일, 최근 {DAILY_INITIAL_VISIBLE}일 표시)
            </Typography>
            <Box
              sx={{ flex: 1, minHeight: 0, border: `1px solid ${COLORS.DIVIDER}`, borderRadius: 1 }}
            >
              <LightweightChart
                data={dailyWithCurrent}
                mode="daily"
                loading={dailyLoading}
                initialVisibleBars={DAILY_INITIAL_VISIBLE}
              />
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" mb={0.5}>
              1분봉 (정규장 09:00~15:30, {Math.round(MINUTE_REFRESH_MS / 1000)}초마다 갱신)
            </Typography>
            <Box
              sx={{ flex: 1, minHeight: 0, border: `1px solid ${COLORS.DIVIDER}`, borderRadius: 1 }}
            >
              <LightweightChart data={minuteData} mode="intraday" loading={minuteLoading} />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default StockChartModal;
