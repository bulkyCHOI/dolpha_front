/**
 * 매매복기 테이블 컴포넌트
 */

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Typography,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// @mui icons
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

// Utils
import { formatNumber, formatPercent, formatDate } from "utils/formatters";

const headCells = [
  { id: 'stock_name', label: '종목명', sortable: true },
  { id: 'trading_mode', label: '거래모드', sortable: true },
  { id: 'total_profit_loss', label: '총손익', sortable: true, numeric: true },
  { id: 'profit_loss_percent', label: '손익률(%)', sortable: true, numeric: true },
  { id: 'holding_days', label: '보유일수', sortable: true, numeric: true },
  { id: 'final_status', label: '상태', sortable: true },
  { id: 'actions', label: '액션', sortable: false },
];

function TradingReviewsTable({ 
  data = [], 
  loading = false, 
  pagination, 
  setPagination, 
  onDelete, 
  onUpdate 
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('updated_at');
  const [selected, setSelected] = useState([]);
  const [detailDialog, setDetailDialog] = useState(null);
  const [memoDialog, setMemoDialog] = useState(null);
  const [memo, setMemo] = useState('');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((item) => item.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({ 
      ...prev, 
      page_size: parseInt(event.target.value, 10),
      page: 0 
    }));
  };

  const handleViewDetail = (row) => {
    setDetailDialog(row);
  };

  const handleEditMemo = (row) => {
    setMemoDialog(row);
    setMemo(row.memo || '');
  };

  const handleSaveMemo = async () => {
    if (memoDialog && onUpdate) {
      try {
        await onUpdate(memoDialog.id, { memo });
        setMemoDialog(null);
        setMemo('');
      } catch (error) {
        console.error('메모 저장 실패:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('삭제 실패:', error);
      }
    }
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const getProfitColor = (value) => {
    if (value > 0) return 'success';
    if (value < 0) return 'error';
    return 'default';
  };

  const getStatusColor = (status) => {
    return status === 'CLOSED' ? 'primary' : 'warning';
  };

  const getStatusLabel = (status) => {
    return status === 'CLOSED' ? '청산완료' : '보유중';
  };

  const getTradingModeLabel = (mode) => {
    return mode === 'manual' ? '수동' : '터틀';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // 모바일 카드 뷰
  if (isMobile) {
    return (
      <Box>
        <Stack spacing={2}>
          {data.map((row) => (
            <Card key={row.id} variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="div">
                    {row.stock_name}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(row.final_status)}
                    color={getStatusColor(row.final_status)}
                    size="small"
                  />
                </Box>
                
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      거래모드:
                    </Typography>
                    <Typography variant="body2">
                      {getTradingModeLabel(row.trading_mode)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      총손익:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={getProfitColor(row.total_profit_loss)}
                      fontWeight="bold"
                    >
                      {row.total_profit_loss > 0 && '+'}
                      {formatNumber(row.total_profit_loss)}원
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      손익률:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={getProfitColor(row.profit_loss_percent)}
                      fontWeight="bold"
                    >
                      {row.profit_loss_percent > 0 && '+'}
                      {formatPercent(row.profit_loss_percent)}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      보유일수:
                    </Typography>
                    <Typography variant="body2">
                      {Math.round(row.holding_days)}일
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Tooltip title="상세보기">
                    <IconButton size="small" onClick={() => handleViewDetail(row)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="메모수정">
                    <IconButton size="small" onClick={() => handleEditMemo(row)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="삭제">
                    <IconButton size="small" onClick={() => handleDelete(row.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* 페이지네이션 */}
        <Box mt={2} display="flex" justifyContent="center">
          <TablePagination
            component="div"
            count={pagination.total || 0}
            page={pagination.page || 0}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.page_size || 20}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
            }
          />
        </Box>
      </Box>
    );
  }

  // 데스크톱 테이블 뷰
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => {
                const isItemSelected = isSelected(row.id);
                
                return (
                  <TableRow
                    hover
                    onClick={() => handleClick(row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                      />
                    </TableCell>
                    
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="subtitle2">
                          {row.stock_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.stock_code}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getTradingModeLabel(row.trading_mode)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        {row.total_profit_loss > 0 ? 
                          <TrendingUpIcon color="success" fontSize="small" /> : 
                          row.total_profit_loss < 0 ? 
                          <TrendingDownIcon color="error" fontSize="small" /> : 
                          null
                        }
                        <Typography 
                          variant="body2" 
                          color={getProfitColor(row.total_profit_loss)}
                          fontWeight="bold"
                        >
                          {row.total_profit_loss > 0 && '+'}
                          {formatNumber(row.total_profit_loss)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getProfitColor(row.profit_loss_percent)}
                        fontWeight="bold"
                      >
                        {row.profit_loss_percent > 0 && '+'}
                        {formatPercent(row.profit_loss_percent)}%
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      {Math.round(row.holding_days)}일
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(row.final_status)}
                        color={getStatusColor(row.final_status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="상세보기">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(row);
                          }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="메모수정">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            handleEditMemo(row);
                          }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row.id);
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      매매복기 데이터가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={pagination.total || 0}
          rowsPerPage={pagination.page_size || 20}
          page={pagination.page || 0}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Paper>

      {/* 상세보기 다이얼로그 */}
      <Dialog 
        open={!!detailDialog} 
        onClose={() => setDetailDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          매매복기 상세정보
        </DialogTitle>
        <DialogContent>
          {detailDialog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">종목명:</Typography>
                <Typography variant="body2">{detailDialog.stock_name} ({detailDialog.stock_code})</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">첫 매수일:</Typography>
                <Typography variant="body2">{formatDate(detailDialog.first_entry_date)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">마지막 매도일:</Typography>
                <Typography variant="body2">{formatDate(detailDialog.last_exit_date)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">총 매수금액:</Typography>
                <Typography variant="body2">{formatNumber(detailDialog.total_buy_amount)}원</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">총 매도금액:</Typography>
                <Typography variant="body2">{formatNumber(detailDialog.total_sell_amount)}원</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">매수/매도 횟수:</Typography>
                <Typography variant="body2">{detailDialog.entry_count} / {detailDialog.exit_count}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">승률:</Typography>
                <Typography variant="body2">{formatPercent(detailDialog.win_rate)}%</Typography>
              </Box>
              {detailDialog.memo && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>메모:</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{detailDialog.memo}</Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 메모 수정 다이얼로그 */}
      <Dialog 
        open={!!memoDialog} 
        onClose={() => setMemoDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          메모 수정
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="메모"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoDialog(null)}>취소</Button>
          <Button onClick={handleSaveMemo} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

TradingReviewsTable.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onUpdate: PropTypes.func,
};

export default TradingReviewsTable;