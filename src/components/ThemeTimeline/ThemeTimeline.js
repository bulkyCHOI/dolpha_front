import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatNumber } from "utils/formatters";
import { todayKST } from "hooks/useThemeSurgeData";
import { COLORS, alpha } from "constants/styles";

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";

const LABEL_WIDTH = 168;
const TRACK_MIN_WIDTH = 620; // 이보다 좁아지면 가로 스크롤
const ROW_HEIGHT = 24;
const BAND_HEIGHT = 5;
const ROW_GAP = 6;
const TICK_MINUTES = 60; // 눈금 간격
const GRID_MINUTES = 30; // 세로 그리드 간격

/**
 * 등락률 → 히트 색상. 국내 관행대로 상승 적색 / 하락 청색이되,
 * 채도를 낮춰 급등 밴드(호박색)와 시각적으로 경쟁하지 않게 한다.
 */
const heatColor = (rate) => {
  if (rate === null || rate === undefined) return COLORS.CHARTBOOK.GRID; // 미수집 슬롯
  if (rate >= 8) return COLORS.HEAT.UP[5];
  if (rate >= 6) return COLORS.HEAT.UP[4];
  if (rate >= 4) return COLORS.HEAT.UP[3];
  if (rate >= 2.5) return COLORS.HEAT.UP[2];
  if (rate >= 1) return COLORS.HEAT.UP[1];
  if (rate > 0) return COLORS.HEAT.UP[0];
  if (rate === 0) return COLORS.HEAT.ZERO;
  if (rate > -1) return COLORS.HEAT.DOWN[0];
  if (rate > -2.5) return COLORS.HEAT.DOWN[1];
  if (rate > -4) return COLORS.HEAT.DOWN[2];
  return COLORS.HEAT.DOWN[3];
};

const LEGEND_STOPS = [-3, -1, 0, 1, 2.5, 4, 6, 8];

/** 강제청산 시각 판정 → 라벨·색 (마커/툴팁 공용). */
const EXIT_META = {
  overnight: { label: "익일 이월", color: COLORS.WARNING },
  force_exit: { label: "당일 강제청산", color: COLORS.DOWN },
  max_days: { label: "보유기간 만료 청산", color: COLORS.DOWN },
  stop_loss: { label: "손절 청산", color: COLORS.CHARTBOOK.INK },
  trailing: { label: "트레일링 청산", color: COLORS.CHARTBOOK.INK },
  staged: { label: "분할 익절", color: COLORS.SUCCESS },
  hold: { label: "유예/보류", color: COLORS.CHARTBOOK.BAND_MID },
};
const exitMeta = (decision) => EXIT_META[decision] || EXIT_META.hold;

const CONDITION_LABELS = {
  foreign: "외국인",
  institution: "기관",
  program: "프로그램",
  shinhan_top5: "신한 상위5",
};

const minuteOf = (slot) => Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3));

/** 09:00 기준 경과 분이 interval 배수인 슬롯만 true */
const isEvery = (slot, interval, baseMinute) => (minuteOf(slot) - baseMinute) % interval === 0;

/** 강제청산 시각 판정 상세 (툴팁 안 블록). */
function ExitDetail({ exit }) {
  const meta = exitMeta(exit.decision);
  const conditions = Array.isArray(exit.overnight_conditions) ? exit.overnight_conditions : [];
  const met = exit.overnight_met || {};
  return (
    <Box sx={{ mt: 0.25 }}>
      <Box sx={{ fontWeight: 700, color: meta.color }}>
        장 마감 · {meta.label} · {exit.days_held}일차
      </Box>
      <Box sx={{ opacity: 0.75, fontFamily: MONO_STACK }}>판정 시각 {exit.force_exit_time}</Box>
      {exit.reason && <Box sx={{ opacity: 0.85 }}>{exit.reason}</Box>}
      {exit.overnight_evaluated && (
        <Box sx={{ mt: 0.25 }}>
          <Box>
            수급 {exit.overnight_met_count}/{exit.overnight_required} 충족
            {!exit.overnight_available && " (일부 조회 실패)"}
          </Box>
          {conditions.map((key) => (
            <Box key={key} sx={{ fontFamily: MONO_STACK }}>
              {met[key] ? "✓" : "✗"} {CONDITION_LABELS[key] || key}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

ExitDetail.propTypes = { exit: PropTypes.object.isRequired };

function CellTooltip({ themeName, slot, cell, signals, exits }) {
  return (
    <Box sx={{ py: 0.5 }}>
      <Box
        sx={{
          fontWeight: 700,
          mb: 0.5,
          fontFamily: MONO_STACK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {themeName} · {slot}
      </Box>
      <Box sx={{ fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
        등락률 {cell.rate >= 0 ? "+" : ""}
        {cell.rate}% · {cell.rank}위
      </Box>
      <Box sx={{ fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
        거래대금 {formatNumber(cell.trading_value)}
      </Box>
      <Box sx={{ fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
        모멘텀 {cell.momentum >= 0 ? "+" : ""}
        {Number(cell.momentum).toFixed(2)}%p
      </Box>
      <Box sx={{ mt: 0.5, opacity: 0.85 }}>{cell.reason}</Box>
      {signals.length > 0 && (
        <Box
          sx={{ mt: 0.75, pt: 0.75, borderTop: `1px solid ${alpha(COLORS.CHARTBOOK.INK, 0.25)}` }}
        >
          {signals.map((s, i) => (
            <Box key={i}>
              [{s.executed ? "진입" : s.passed ? "조건충족" : "판정"}] {s.stock_name} — {s.reason}
            </Box>
          ))}
        </Box>
      )}
      {exits.length > 0 && (
        <Box
          sx={{ mt: 0.75, pt: 0.75, borderTop: `1px solid ${alpha(COLORS.CHARTBOOK.INK, 0.25)}` }}
        >
          {exits.map((e, i) => (
            <ExitDetail key={i} exit={e} />
          ))}
        </Box>
      )}
    </Box>
  );
}

CellTooltip.propTypes = {
  themeName: PropTypes.string.isRequired,
  slot: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  signals: PropTypes.array.isRequired,
  exits: PropTypes.array.isRequired,
};

/** 세로 그리드 라인 + 시각 눈금 (셀 열과 정확히 정렬) */
function TimeAxis({ slots, baseMinute }) {
  return (
    <Box sx={{ display: "flex", height: 16, position: "relative" }}>
      {slots.map((slot, idx) => (
        <Box key={slot} sx={{ flex: "1 1 0", position: "relative" }}>
          {isEvery(slot, TICK_MINUTES, baseMinute) && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: idx === 0 ? "none" : "translateX(-50%)",
                fontSize: 10,
                lineHeight: "16px",
                color: COLORS.CHARTBOOK.INK,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                fontFamily: MONO_STACK,
              }}
            >
              {slot}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

TimeAxis.propTypes = {
  slots: PropTypes.array.isRequired,
  baseMinute: PropTypes.number.isRequired,
};

function GridLines({ slots, baseMinute }) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {slots.map((slot) => (
        <Box
          key={slot}
          sx={{
            flex: "1 1 0",
            borderLeft: isEvery(slot, GRID_MINUTES, baseMinute)
              ? `1px solid ${COLORS.CHARTBOOK.GRID}`
              : "none",
          }}
        />
      ))}
    </Box>
  );
}

GridLines.propTypes = {
  slots: PropTypes.array.isRequired,
  baseMinute: PropTypes.number.isRequired,
};

/** is_surge 인 인접 슬롯을 [{start, length}] 구간으로 병합한다. */
const mergeSurgeSegments = (cells) => {
  const segments = [];
  let start = -1;

  cells.forEach((cell, idx) => {
    if (cell?.is_surge) {
      if (start < 0) start = idx;
      return;
    }
    if (start >= 0) {
      segments.push({ start, length: idx - start });
      start = -1;
    }
  });
  if (start >= 0) segments.push({ start, length: cells.length - start });

  return segments;
};

/** 장중이면 '지금 여기까지' 세로선을 그린다. 장 마감 후·과거 날짜면 null. */
function NowMarker({ slots, nowMinute }) {
  if (nowMinute === null) return null;

  const first = minuteOf(slots[0]);
  const last = minuteOf(slots[slots.length - 1]);
  if (nowMinute < first || nowMinute > last) return null;

  const ratio = (nowMinute - first) / (last - first);
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${ratio * 100}%`,
        width: "2px",
        bgcolor: COLORS.CHARTBOOK.PANEL_BLUE,
        opacity: 0.6,
        zIndex: 4,
        pointerEvents: "none",
      }}
    />
  );
}

NowMarker.propTypes = {
  slots: PropTypes.array.isRequired,
  nowMinute: PropTypes.number,
};
NowMarker.defaultProps = { nowMinute: null };

function ThemeRow({ theme, slots, baseMinute, signalIndex, exitIndex, nowMinute }) {
  const leaderCode = theme.leader?.stock_code;
  const surgeSegments = useMemo(() => mergeSurgeSegments(theme.cells), [theme.cells]);

  return (
    <Box sx={{ display: "flex", alignItems: "stretch", mb: `${ROW_GAP}px` }}>
      {/* 테마 라벨 — 가로 스크롤 시에도 고정 */}
      <Box
        sx={{
          width: LABEL_WIDTH,
          flexShrink: 0,
          pr: 1.5,
          position: "sticky",
          left: 0,
          zIndex: 3,
          bgcolor: COLORS.CHARTBOOK.GROUND,
        }}
      >
        <Typography
          variant="button"
          fontWeight="bold"
          sx={{
            fontSize: 13,
            lineHeight: 1.3,
            display: "block",
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          {theme.theme_name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: MONO_STACK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Box component="span" sx={{ color: COLORS.UP, fontWeight: 700 }}>
            {theme.peak_rate >= 0 ? "+" : ""}
            {theme.peak_rate}%
          </Box>
          {theme.surge_slots.length > 0 && (
            <Box component="span" sx={{ color: COLORS.CHARTBOOK.BAND_MID, fontWeight: 600 }}>
              {` · 급등 ${theme.surge_slots.length}회`}
            </Box>
          )}
          {theme.leader && ` · ${theme.leader.stock_name}`}
        </Typography>
      </Box>

      {/* 히트 트랙 + 급등 밴드 */}
      <Box sx={{ flex: 1, position: "relative", minWidth: 0 }}>
        <GridLines slots={slots} baseMinute={baseMinute} />
        <NowMarker slots={slots} nowMinute={nowMinute} />

        <Box sx={{ display: "flex", height: ROW_HEIGHT, borderRadius: "3px", overflow: "hidden" }}>
          {slots.map((slot, idx) => {
            const cell = theme.cells[idx];
            const signals = leaderCode ? signalIndex[`${leaderCode}|${slot}`] || [] : [];
            const exits = leaderCode ? exitIndex[`${leaderCode}|${slot}`] || [] : [];
            const body = (
              <Box
                sx={{
                  flex: "1 1 0",
                  bgcolor: heatColor(cell ? cell.rate : null),
                  position: "relative",
                  zIndex: 2,
                  cursor: cell || exits.length ? "pointer" : "default",
                  transition: "filter .12s",
                  "&:hover": cell ? { filter: "brightness(1.18)" } : {},
                }}
              >
                {signals.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: signals.some((s) => s.executed)
                        ? COLORS.SUCCESS
                        : COLORS.CHARTBOOK.INK,
                      border: `1px solid ${COLORS.CHARTBOOK.GROUND}`,
                    }}
                  />
                )}
                {exits.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%) rotate(45deg)",
                      width: 8,
                      height: 8,
                      bgcolor: exitMeta(exits[0].decision).color,
                      border: `1px solid ${COLORS.CHARTBOOK.GROUND}`,
                    }}
                  />
                )}
              </Box>
            );

            if (!cell && exits.length === 0)
              return <React.Fragment key={slot}>{body}</React.Fragment>;

            return (
              <Tooltip
                key={slot}
                arrow
                placement="top"
                title={
                  <CellTooltip
                    themeName={theme.theme_name}
                    slot={slot}
                    cell={cell || { rate: 0, rank: "-", trading_value: 0, momentum: 0, reason: "" }}
                    signals={signals}
                    exits={exits}
                  />
                }
              >
                {body}
              </Tooltip>
            );
          })}
        </Box>

        {/* 급등 판정 구간 — 인접 슬롯을 하나의 막대로 병합해 '구간'으로 읽히게 한다 */}
        <Box sx={{ position: "relative", height: BAND_HEIGHT, mt: "2px" }}>
          {surgeSegments.map((seg) => (
            <Box
              key={seg.start}
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${(seg.start / slots.length) * 100}%`,
                width: `${(seg.length / slots.length) * 100}%`,
                bgcolor: COLORS.WARNING,
                borderRadius: "2px",
                zIndex: 2,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

ThemeRow.propTypes = {
  theme: PropTypes.object.isRequired,
  slots: PropTypes.array.isRequired,
  baseMinute: PropTypes.number.isRequired,
  signalIndex: PropTypes.object.isRequired,
  exitIndex: PropTypes.object.isRequired,
  nowMinute: PropTypes.number,
};

ThemeRow.defaultProps = { nowMinute: null };

export function TimelineLegend() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          등락률
        </Typography>
        <Box sx={{ display: "flex", borderRadius: "0", overflow: "hidden" }}>
          {LEGEND_STOPS.map((rate) => (
            <Box key={rate} sx={{ width: 12, height: 10, bgcolor: heatColor(rate) }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ width: 18, height: 5, bgcolor: COLORS.WARNING, borderRadius: "0" }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          급등 판정
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: COLORS.CHARTBOOK.INK }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          진입 판정
        </Typography>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: COLORS.SUCCESS, ml: 0.5 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          실제 진입
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, transform: "rotate(45deg)", bgcolor: COLORS.WARNING }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          익일 이월
        </Typography>
        <Box
          sx={{ width: 8, height: 8, transform: "rotate(45deg)", bgcolor: COLORS.DOWN, ml: 0.5 }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          강제청산
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ width: 2, height: 12, bgcolor: COLORS.CHARTBOOK.PANEL_BLUE, opacity: 0.6 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          현재 시각
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * 09:00~15:30 급등 테마 타임라인.
 * 행 = 테마, 열 = 5분 슬롯. 셀 색 = 등락률, 아래 호박색 밴드 = 급등 판정 구간,
 * 점 = 주도주 진입 조건 판정(진회색) / 실제 진입(초록).
 *
 * 셀 폭은 컨테이너를 균등 분할해 하루치가 가로 스크롤 없이 한눈에 들어오며,
 * 좁은 화면에서만 최소 폭을 유지한 채 스크롤된다.
 */
function ThemeTimeline({ slots, themes, signals, exits, date }) {
  const signalIndex = useMemo(() => {
    const index = {};
    signals.forEach((signal) => {
      const key = `${signal.stock_code}|${signal.slot}`;
      if (!index[key]) index[key] = [];
      index[key].push(signal);
    });
    return index;
  }, [signals]);

  const exitIndex = useMemo(() => {
    const index = {};
    exits.forEach((exit) => {
      const key = `${exit.stock_code}|${exit.slot}`;
      if (!index[key]) index[key] = [];
      index[key].push(exit);
    });
    return index;
  }, [exits]);

  const baseMinute = useMemo(() => (slots.length ? minuteOf(slots[0]) : 540), [slots]);

  // 오늘 날짜를 보고 있을 때만 '현재 시각' 세로선을 그린다
  const nowMinute = useMemo(() => {
    if (!date || date !== todayKST()) return null;
    const now = new Date();
    const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
    return kst.getHours() * 60 + kst.getMinutes();
  }, [date]);

  if (!slots.length || !themes.length) {
    return (
      <Box py={6} textAlign="center">
        <Typography variant="body2" sx={{ color: COLORS.CHARTBOOK.INK }}>
          해당 날짜에 수집된 급등 테마가 없습니다.
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.CHARTBOOK.INK, fontSize: 12 }}>
          장중(09:00~15:30)에 5분마다 자동 수집됩니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto", pb: 0.5 }}>
      <Box sx={{ minWidth: LABEL_WIDTH + TRACK_MIN_WIDTH }}>
        <Box sx={{ display: "flex", mb: 0.5 }}>
          <Box sx={{ width: LABEL_WIDTH, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TimeAxis slots={slots} baseMinute={baseMinute} />
          </Box>
        </Box>

        {themes.map((theme) => (
          <ThemeRow
            key={theme.tics_id}
            theme={theme}
            slots={slots}
            baseMinute={baseMinute}
            signalIndex={signalIndex}
            exitIndex={exitIndex}
            nowMinute={nowMinute}
          />
        ))}
      </Box>
    </Box>
  );
}

ThemeTimeline.propTypes = {
  slots: PropTypes.arrayOf(PropTypes.string).isRequired,
  themes: PropTypes.arrayOf(PropTypes.object).isRequired,
  signals: PropTypes.arrayOf(PropTypes.object),
  exits: PropTypes.arrayOf(PropTypes.object),
  date: PropTypes.string,
};

ThemeTimeline.defaultProps = {
  signals: [],
  exits: [],
  date: "",
};

export default ThemeTimeline;
