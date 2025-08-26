/**
 * 매매복기 필터링 컴포넌트
 */

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Box,
  IconButton,
  Collapse,
  Typography,
} from "@mui/material";

// @mui icons
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// date-fns for date formatting
import { format } from "date-fns";

function TradingReviewsFilter({ filters, setFilters, onApplyFilters }) {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1 // 필터 변경 시 첫 페이지로 이동
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      stock_name: "",
      trading_mode: "all",
      final_status: "all",
      profit_filter: "all",
      start_date: null,
      end_date: null,
      page: 1,
      page_size: 20
    });
  };

  const handleSearch = () => {
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.stock_name ||
      (filters.trading_mode && filters.trading_mode !== "all") ||
      (filters.final_status && filters.final_status !== "all") ||
      (filters.profit_filter && filters.profit_filter !== "all") ||
      filters.start_date ||
      filters.end_date
    );
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon color="primary" />
            <Typography variant="h6" component="div">
              필터링
            </Typography>
            {hasActiveFilters() && (
              <Typography variant="caption" color="primary">
                (활성화됨)
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "접기" : "펼치기"}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={2}>
              {/* 종목명 검색 */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="종목명/코드"
                  placeholder="삼성전자, 005930"
                  value={filters.stock_name || ""}
                  onChange={(e) => handleFilterChange("stock_name", e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>

              {/* 거래모드 선택 */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>거래모드</InputLabel>
                  <Select
                    value={filters.trading_mode || "all"}
                    label="거래모드"
                    onChange={(e) => handleFilterChange("trading_mode", e.target.value)}
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="manual">수동</MenuItem>
                    <MenuItem value="turtle">터틀</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 최종상태 선택 */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={filters.final_status || "all"}
                    label="상태"
                    onChange={(e) => handleFilterChange("final_status", e.target.value)}
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="CLOSED">청산완료</MenuItem>
                    <MenuItem value="HOLDING">보유중</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 손익 필터 */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>손익</InputLabel>
                  <Select
                    value={filters.profit_filter || "all"}
                    label="손익"
                    onChange={(e) => handleFilterChange("profit_filter", e.target.value)}
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="positive">수익</MenuItem>
                    <MenuItem value="negative">손실</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 시작 날짜 */}
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  label="시작일"
                  type="date"
                  value={filters.start_date ? (
                    filters.start_date instanceof Date ? 
                      format(filters.start_date, 'yyyy-MM-dd') : 
                      ''
                  ) : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleFilterChange("start_date", date);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* 종료 날짜 */}
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  label="종료일"
                  type="date"
                  value={filters.end_date ? (
                    filters.end_date instanceof Date ? 
                      format(filters.end_date, 'yyyy-MM-dd') : 
                      ''
                  ) : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleFilterChange("end_date", date);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* 액션 버튼들 */}
              <Grid item xs={12}>
                <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters()}
                  >
                    초기화
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                  >
                    검색
                  </Button>
                </Box>
              </Grid>
            </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
}

TradingReviewsFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func,
};

export default TradingReviewsFilter;