import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import { COLORS, alpha } from "constants/styles";

const InflectionPointToggle = ({
  showInflectionPoints = false,
  onToggle,
  disabled = false,
  size = "small",
}) => {
  return (
    <Tooltip title={showInflectionPoints ? "VCP 패턴 숨기기" : "VCP 패턴 찾기"}>
      <ToggleButton
        value="inflectionPoints"
        selected={showInflectionPoints}
        onChange={onToggle}
        size={size}
        disabled={disabled}
        color="primary"
        sx={{
          border: `1px solid ${showInflectionPoints ? COLORS.CHARTBOOK.INK : COLORS.CHARTBOOK.GRID}`,
          color: showInflectionPoints ? COLORS.CHARTBOOK.INK : COLORS.CHARTBOOK.INK,
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06),
          },
          "&.Mui-selected": {
            backgroundColor: "transparent",
            color: COLORS.CHARTBOOK.INK,
            borderColor: COLORS.CHARTBOOK.INK,
            "&:hover": {
              backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06),
            },
          },
          "&.Mui-disabled": {
            color: COLORS.CHARTBOOK.GRID,
            backgroundColor: "transparent",
            border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
          },
        }}
      >
        📈
      </ToggleButton>
    </Tooltip>
  );
};

export default InflectionPointToggle;
