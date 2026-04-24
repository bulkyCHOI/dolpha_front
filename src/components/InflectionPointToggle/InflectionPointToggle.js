import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";

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
          border: "1px solid #2196f3",
          color: showInflectionPoints ? "white" : "#2196f3",
          backgroundColor: showInflectionPoints ? "#2196f3" : "transparent",
          "&:hover": {
            backgroundColor: showInflectionPoints ? "#1976d2" : "rgba(33, 150, 243, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "#2196f3",
            color: "white",
            "&:hover": {
              backgroundColor: "#1976d2",
            },
          },
          "&.Mui-disabled": {
            color: "#bdbdbd",
            backgroundColor: "transparent",
            border: "1px solid #e0e0e0",
          },
        }}
      >
        📈
      </ToggleButton>
    </Tooltip>
  );
};

export default InflectionPointToggle;
