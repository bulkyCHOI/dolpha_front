import React from "react";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { COLORS } from "constants/styles";
import { FINANCIAL_FILTER_FIELDS } from "constants/screenerFilters";
import { useAuth } from "contexts/AuthContext";

// 마이페이지의 '종목 필터' 탭 위치
const MY_PAGE_SCREENER_TAB = 2;

/**
 * 종목 목록 상단의 재무 필터 바.
 * 각 입력값은 "% 이상" 조건으로 동작하며, 비어 있으면 조건에서 제외된다.
 * 마이페이지에 저장한 기본값이 있으면 처음부터 채워진 상태로 열린다.
 */
function FinancialFilter({
  filters,
  onChange,
  onReset,
  isActive = false,
  hasDefaults = false,
  filteredCount = 0,
  totalCount = 0,
}) {
  const { isAuthenticated } = useAuth();

  const statusText = isActive
    ? `필터 적용: ${filteredCount} / ${totalCount} 종목${hasDefaults ? " · 마이페이지 기본값" : ""}`
    : `전체 ${totalCount} 종목 · 값을 입력하면 해당 % 이상만 표시`;

  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1,
        py: 0.75,
        borderBottom: `1px solid ${COLORS.BORDER}`,
        backgroundColor: COLORS.SURFACE_ALT,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {FINANCIAL_FILTER_FIELDS.map(({ field, label }) => (
          <Tooltip key={field} title={`${label} 입력값(%) 이상만 표시`} arrow>
            <TextField
              size="small"
              type="number"
              value={filters[field] ?? ""}
              onChange={(event) => onChange(field, event.target.value)}
              placeholder={label}
              inputProps={{ "aria-label": `${label} 최소값`, style: { padding: "6px 8px" } }}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: COLORS.SURFACE,
                  fontSize: "0.75rem",
                },
              }}
            />
          </Tooltip>
        ))}
        <Tooltip title="필터 초기화(전체 보기)" arrow>
          <span>
            <IconButton size="small" onClick={onReset} disabled={!isActive}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mt: 0.25,
        }}
      >
        <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY }}>
          {statusText}
        </Typography>
        {isAuthenticated && (
          <Link
            component={RouterLink}
            to="/pages/my-page"
            state={{ activeTab: MY_PAGE_SCREENER_TAB }}
            variant="caption"
            sx={{ flexShrink: 0, color: COLORS.PRIMARY, whiteSpace: "nowrap" }}
          >
            기본값 설정
          </Link>
        )}
      </Box>
    </Box>
  );
}

FinancialFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  hasDefaults: PropTypes.bool,
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
};

export default FinancialFilter;
