import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import { COLORS } from "constants/styles";

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
          border: `1px solid ${COLORS.DOWN}`,
          color: showInflectionPoints ? COLORS.ON_ACCENT : COLORS.DOWN,
          backgroundColor: showInflectionPoints ? COLORS.DOWN : "transparent",
          "&:hover": {
            backgroundColor: showInflectionPoints ? COLORS.DOWN : "rgba(33, 150, 243, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: COLORS.DOWN,
            color: COLORS.ON_ACCENT,
            "&:hover": {
              backgroundColor: COLORS.DOWN,
            },
          },
          "&.Mui-disabled": {
            color: COLORS.BORDER_STRONG,
            backgroundColor: "transparent",
            border: `1px solid ${COLORS.BORDER}`,
          },
        }}
      >
        📈
      </ToggleButton>
    </Tooltip>
  );
};

export default InflectionPointToggle;
