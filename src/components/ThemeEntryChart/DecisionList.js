import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ButtonBase from "@mui/material/ButtonBase";

import Typography from "@mui/material/Typography";
import { CHART_COLORS, CONDITIONS, decisionStatus, exitStatus } from "./constants";
import { COLORS } from "constants/styles";

/** 3조건 충족 여부를 점 3개로 압축 표시한다. */
function ConditionDots({ decision }) {
  return (
    <Box sx={{ display: "flex", gap: 0.4 }}>
      {CONDITIONS.map(({ key, label, color }) => (
        <Box
          key={key}
          title={label}
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: decision[key] ? color : "#dfe4ea",
          }}
        />
      ))}
    </Box>
  );
}

ConditionDots.propTypes = { decision: PropTypes.object.isRequired };

/** 선택 시 목록이 따라 스크롤되도록 공통 껍데기를 맞춘다. */
function Row({ selected, accent, onClick, left, right }) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (selected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <ButtonBase
      ref={rowRef}
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.25,
        py: 0.9,
        borderRadius: 1,
        textAlign: "left",
        border: "1px solid",
        borderColor: selected ? COLORS.PRIMARY : "transparent",
        // 청산 행은 좌측 색 띠로 진입 판정과 한눈에 구분한다
        borderLeft: accent ? `3px solid ${accent}` : "1px solid transparent",
        bgcolor: selected ? COLORS.TINT_PRIMARY : "transparent",
        "&:hover": { bgcolor: selected ? COLORS.TINT_PRIMARY : COLORS.ROW_HOVER },
      }}
    >
      {left}
      {right}
    </ButtonBase>
  );
}

Row.propTypes = {
  selected: PropTypes.bool.isRequired,
  accent: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  left: PropTypes.node.isRequired,
  right: PropTypes.node.isRequired,
};

Row.defaultProps = { accent: null };

function DecisionRow({ decision, selected, onSelect }) {
  const status = decisionStatus(decision);

  return (
    <Row
      selected={selected}
      onClick={() => onSelect(decision)}
      left={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography
            variant="button"
            sx={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          >
            {decision.time}
          </Typography>
          <ConditionDots decision={decision} />
        </Box>
      }
      right={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontSize: 11, color: CHART_COLORS.MUTED }}>
            {decision.conditions_met}/3
          </Typography>
          <Chip
            size="small"
            label={status.label}
            sx={{
              height: 18,
              fontSize: 10.5,
              fontWeight: 700,
              bgcolor: status.bg,
              color: status.color,
            }}
          />
        </Box>
      }
    />
  );
}

DecisionRow.propTypes = {
  decision: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

/** 청산 체결 1행 — 진입 판정과 달리 조건 점 대신 손익률을 보여준다. */
function ExitRow({ exit, selected, onSelect }) {
  const status = exitStatus(exit);
  const rate = exit.profit_loss_rate;
  const rateColor = rate == null ? CHART_COLORS.MUTED : rate >= 0 ? COLORS.UP : COLORS.DOWN;

  return (
    <Row
      selected={selected}
      accent={CHART_COLORS.EXIT}
      onClick={() => onSelect(exit)}
      left={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Typography
            variant="button"
            sx={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          >
            {exit.exited_at}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: 11, fontWeight: 700, color: rateColor, whiteSpace: "nowrap" }}
          >
            {rate == null ? "—" : `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}%`}
          </Typography>
        </Box>
      }
      right={
        <Chip
          size="small"
          label={status.label}
          sx={{
            height: 18,
            fontSize: 10.5,
            fontWeight: 700,
            bgcolor: status.bg,
            color: status.color,
            flexShrink: 0,
          }}
        />
      }
    />
  );
}

ExitRow.propTypes = {
  exit: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

/**
 * 하루치 진입 판정 + 청산 체결을 시각순으로 합친 목록.
 * 행을 누르면 그 시점 기준으로 차트가 다시 그려진다.
 */
function DecisionList({ items, selected, onSelect, maxHeight }) {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: CHART_COLORS.MUTED }}>
          판정·청산 이력이 없습니다.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        pr: 0.5,
      }}
    >
      {items.map((item) => {
        const isSelected = selected?.kind === item.kind && selected?.id === item.id;
        return item.kind === "exit" ? (
          <ExitRow key={`exit-${item.id}`} exit={item} selected={isSelected} onSelect={onSelect} />
        ) : (
          <DecisionRow
            key={`decision-${item.id}`}
            decision={item}
            selected={isSelected}
            onSelect={onSelect}
          />
        );
      })}
    </Box>
  );
}

DecisionList.propTypes = {
  items: PropTypes.array,
  selected: PropTypes.shape({ kind: PropTypes.string, id: PropTypes.number }),
  onSelect: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
};

DecisionList.defaultProps = { items: [], selected: null, maxHeight: 380 };

export default DecisionList;
