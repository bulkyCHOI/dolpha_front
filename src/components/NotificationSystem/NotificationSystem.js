import React, { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { COLORS, alpha } from "constants/styles";

/**
 * Severity별 배경색 반환
 */
const getSeverityBackground = (severity) => {
  switch (severity) {
    case "success":
      return alpha(COLORS.SUCCESS, 0.08);
    case "error":
      return alpha(COLORS.UP, 0.08);
    case "warning":
      return alpha(COLORS.WARNING, 0.08);
    case "info":
    default:
      return alpha(COLORS.CHARTBOOK.PANEL_BLUE, 0.08);
  }
};

/**
 * Severity별 텍스트 색 반환
 */
const getSeverityColor = (severity) => {
  switch (severity) {
    case "success":
      return COLORS.SUCCESS;
    case "error":
      return COLORS.UP;
    case "warning":
      return COLORS.WARNING;
    case "info":
    default:
      return COLORS.CHARTBOOK.PANEL_BLUE;
  }
};

/**
 * Severity별 보더 색 반환
 */
const getSeverityBorder = (severity) => {
  switch (severity) {
    case "success":
      return COLORS.SUCCESS;
    case "error":
      return COLORS.UP;
    case "warning":
      return COLORS.WARNING;
    case "info":
    default:
      return COLORS.CHARTBOOK.PANEL_BLUE;
  }
};

/**
 * 알림 시스템 컴포넌트
 */
const NotificationSystem = ({ snackbar, onClose }) => {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        sx={{
          width: "100%",
          backgroundColor: getSeverityBackground(snackbar.severity),
          color: getSeverityColor(snackbar.severity),
          border: `1px solid ${getSeverityBorder(snackbar.severity)}`,
          borderRadius: 0,
          fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

/**
 * 알림 시스템 훅
 */
export const useNotification = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info", // 'success', 'error', 'warning', 'info'
  });

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    snackbar,
    showSnackbar,
    handleSnackbarClose,
    NotificationComponent: () => (
      <NotificationSystem snackbar={snackbar} onClose={handleSnackbarClose} />
    ),
  };
};

export default NotificationSystem;
