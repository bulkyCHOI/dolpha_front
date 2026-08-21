import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ButtonBase from "@mui/material/ButtonBase";

import Typography from "@mui/material/Typography";
import { CHART_COLORS, CONDITIONS, decisionStatus } from "./constants";
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

function DecisionRow({ decision, selected, onSelect }) {
  const status = decisionStatus(decision);
  const rowRef = useRef(null);

  useEffect(() => {
    if (selected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <ButtonBase
      ref={rowRef}
      onClick={() => onSelect(decision)}
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
        borderColor: selected ? "#c7d2fe" : "transparent",
        bgcolor: selected ? COLORS.TINT_PRIMARY : "transparent",
        "&:hover": { bgcolor: selected ? COLORS.TINT_PRIMARY : "#f5f7fa" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Typography
          variant="button"
          sx={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {decision.time}
        </Typography>
        <ConditionDots decision={decision} />
      </Box>
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
    </ButtonBase>
  );
}

DecisionRow.propTypes = {
  decision: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

/**
 * 하루치 판정 이력 목록.
 * 행을 누르면 그 시점 기준으로 차트의 전고점·눌림 구간이 다시 그려진다.
 */
function DecisionList({ decisions, selectedId, onSelect, maxHeight }) {
  if (decisions.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: CHART_COLORS.MUTED }}>
          판정 이력이 없습니다.
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
      {decisions.map((decision) => (
        <DecisionRow
          key={decision.id}
          decision={decision}
          selected={decision.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
}

DecisionList.propTypes = {
  decisions: PropTypes.array,
  selectedId: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
};

DecisionList.defaultProps = { decisions: [], selectedId: null, maxHeight: 380 };

export default DecisionList;
