import React from "react";
import { Box, Typography } from "@mui/material";
import { COLORS } from "constants/styles";

/**
 * Chartbook 스타일 챕터 헤더
 * 전략명 · 날짜 · 후보 개수 (Archivo + Fragment Mono)
 */
export default function ChartbookHeader({
  strategyName = "Minervini Trend Template",
  date = new Date().toLocaleDateString("ko-KR"),
  candidateCount = 0,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: 2,
        p: 1.5,
        borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}`,
        backgroundColor: COLORS.CHARTBOOK.GROUND,
        "@supports (font-family: 'Archivo')": {
          fontFamily: "'Archivo', sans-serif",
        },
      }}
    >
      {/* 전략명 (Archivo) */}
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: COLORS.CHARTBOOK.INK,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
        }}
      >
        {strategyName}
      </Typography>

      {/* 구분선 */}
      <Box
        sx={{
          width: "1px",
          height: 12,
          backgroundColor: COLORS.CHARTBOOK.GRID,
        }}
      />

      {/* 날짜 (Fragment Mono 나 monospace) */}
      <Typography
        sx={{
          fontSize: "0.875rem",
          color: COLORS.TEXT_SECONDARY,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "'Fragment Mono', 'Monaco', monospace",
          whiteSpace: "nowrap",
        }}
      >
        {date}
      </Typography>

      {/* 구분선 */}
      <Box
        sx={{
          width: "1px",
          height: 12,
          backgroundColor: COLORS.CHARTBOOK.GRID,
        }}
      />

      {/* 후보 개수 (Fragment Mono) */}
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: COLORS.CHARTBOOK.INK,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "'Fragment Mono', 'Monaco', monospace",
        }}
      >
        {candidateCount}
        <Typography
          component="span"
          sx={{
            fontSize: "0.75rem",
            color: COLORS.TEXT_SECONDARY,
            ml: 0.5,
          }}
        >
          candidates
        </Typography>
      </Typography>
    </Box>
  );
}
