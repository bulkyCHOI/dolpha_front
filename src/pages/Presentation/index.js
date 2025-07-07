/*
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
/* eslint-disable */
// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import SwapVert from "@mui/icons-material/SwapVert";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";

// Routes
import routes from "routes";

import { useState, useEffect, useRef } from "react";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  CandlestickController,
  CandlestickElement,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function Presentation() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [sortField, setSortField] = useState("rsRank");
  const [sortDirection, setSortDirection] = useState("asc");
  const [ohlcvData, setOhlcvData] = useState([]); // OHLCV 데이터 상태 추가
  const [chartLoading, setChartLoading] = useState(false); // 차트 로딩 상태
  
  // 실제 OHLCV 데이터 가져오기
  const fetchOHLCVData = async (stockCode) => {
    if (!stockCode) return [];
    
    try {
      setChartLoading(true);
      const response = await fetch(`http://218.152.32.218:8000/api/find_stock_ohlcv?code=${stockCode}&limit=63`);
      if (!response.ok) {
        throw new Error('OHLCV 데이터를 가져올 수 없습니다');
      }
      const result = await response.json();
      const data = result.data || [];
      
      // 날짜순으로 정렬 (오래된 날짜부터)
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setOhlcvData(sortedData);
      return sortedData;
    } catch (err) {
      console.error('OHLCV 데이터 로드 실패:', err);
      setOhlcvData([]);
      return [];
    } finally {
      setChartLoading(false);
    }
  };

  // 캔들스틱 차트 데이터 생성
  const createCandlestickData = (ohlcvData) => {
    if (!ohlcvData || ohlcvData.length === 0) return null;

    return {
      datasets: [
        {
          label: '캔들스틱',
          type: 'candlestick',
          data: ohlcvData.map(item => ({
            x: new Date(item.date).getTime(),
            o: item.open,
            h: item.high,
            l: item.low,
            c: item.close
          })),
          borderColor: function(context) {
            const data = context.parsed;
            return data.c >= data.o ? '#4caf50' : '#f44336';
          },
          backgroundColor: function(context) {
            const data = context.parsed;
            return data.c >= data.o ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
          },
          color: {
            up: '#4caf50',
            down: '#f44336',
            unchanged: '#999'
          }
        }
      ]
    };
  };

  // 거래량 차트 데이터 생성
  const createVolumeData = (ohlcvData) => {
    if (!ohlcvData || ohlcvData.length === 0) return null;

    return {
      datasets: [
        {
          label: '거래량',
          type: 'bar',
          data: ohlcvData.map(item => ({
            x: new Date(item.date).getTime(),
            y: item.volume || 0
          })),
          backgroundColor: ohlcvData.map(item => 
            item.close >= item.open ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'
          ),
          borderColor: ohlcvData.map(item => 
            item.close >= item.open ? '#4caf50' : '#f44336'
          ),
          borderWidth: 1
        }
      ]
    };
  };

  // API 데이터 가져오기
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://218.152.32.218:8000/api/find_stock_inMTT?format=json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        const data = result.data || []; // API 응답에서 data 배열 추출
        setStockData(data);
        if (data.length > 0) {
          setSelectedStock(data[0]); // 첫 번째 종목을 기본 선택
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  // 선택된 종목이 변경될 때 OHLCV 데이터 가져오기
  useEffect(() => {
    if (selectedStock && selectedStock.code) {
      fetchOHLCVData(selectedStock.code);
    }
  }, [selectedStock]);

  // 테이블 헤더 정의 (name, rsRank, 당기매출, 당기영업이익 사용)
  const tableHeaders = ['name', 'rsRank', '당기매출', '당기영업이익'];
  const tableHeaderLabels = ['종목명', 'RS순위', '당기매출', '당기영업이익'];

  // 숫자를 억/조 단위로 포맷팅하는 함수
  const formatNumber = (value) => {
    if (!value || value === 0) return '0';
    
    const numValue = Number(value);
    if (isNaN(numValue)) return value;

    const absValue = Math.abs(numValue);
    
    if (absValue >= 1000000000000) { // 조 단위 (1조 = 1,000,000,000,000)
      return `${(numValue / 1000000000000).toFixed(1)}조`;
    } else if (absValue >= 100000000) { // 억 단위 (1억 = 100,000,000)
      return `${(numValue / 100000000).toFixed(1)}억`;
    } else if (absValue >= 10000) { // 만 단위
      return `${(numValue / 10000).toFixed(1)}만`;
    } else {
      return numValue.toLocaleString();
    }
  };

  // 셀 값을 포맷팅하는 함수
  const formatCellValue = (value, header) => {
    if (header === '당기매출' || header === '당기영업이익') {
      return formatNumber(value);
    }
    return value;
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  // 실제 OHLCV 데이터로 차트 생성
  const chartData = createCandlestickData(ohlcvData);
  const volumeData = createVolumeData(ohlcvData);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 30,
        right: 30
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MM/dd'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 14
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 10
        }
      },
      y: {
        beginAtZero: false,
        grace: '5%',
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 14
          },
          padding: 15,
          callback: function(value) {
            return new Intl.NumberFormat('ko-KR').format(Math.round(value));
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return new Date(context[0].parsed.x).toLocaleDateString('ko-KR');
          },
          beforeBody: function(context) {
            const data = context[0].parsed;
            if (!data || !data.o) return '';
            
            const changePercent = ((data.c - data.o) / data.o * 100).toFixed(2);
            return `당일변화: ${changePercent > 0 ? '+' : ''}${changePercent}%`;
          },
          label: function(context) {
            const data = context.parsed;
            if (!data) return '';
            
            return [
              `시가: ${new Intl.NumberFormat('ko-KR').format(data.o)}`,
              `고가: ${new Intl.NumberFormat('ko-KR').format(data.h)}`,
              `저가: ${new Intl.NumberFormat('ko-KR').format(data.l)}`,
              `종가: ${new Intl.NumberFormat('ko-KR').format(data.c)}`
            ];
          }
        },
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    layout: {
      padding: {
        top: 10,
        bottom: 20,
        left: 30,
        right: 30
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MM/dd'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 10
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          padding: 15,
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          }
        },
        title: {
          display: true,
          text: '거래량',
          color: '#666',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return new Date(context[0].parsed.x).toLocaleDateString('ko-KR');
          },
          label: function(context) {
            return `거래량: ${new Intl.NumberFormat('ko-KR').format(context.parsed.y)}`;
          }
        },
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  };

  return (
    <>
      <DefaultNavbar
        routes={routes}
        sticky
      />
      <Box
        sx={{
          height: "100vh",
          width: "100%",
          backgroundColor: "#f8f9fa",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 네비게이션 바 높이만큼 패딩 추가 */}
        <Box sx={{ height: "80px", flexShrink: 0 }} />
        
        <Grid container spacing={1} sx={{ height: "calc(100vh - 80px)", p: 1 }}>
          {/* 왼쪽 차트 영역 */}
          <Grid item xs={12} md={9} sx={{ 
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            <MKBox
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* 헤더 부분 */}
              <MKBox sx={{ p: 2, flexShrink: 0, borderBottom: "1px solid #e0e0e0" }}>
                {/* <MKTypography variant="h5" textAlign="center">
                  {selectedStock ? `${selectedStock.name || '선택된 종목'} 차트` : '차트'}
                </MKTypography> */}
                
                {/* 선택된 종목 정보 */}
                {selectedStock && (
                  <MKBox mt={1} p={1.5} sx={{ backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                    <Grid container spacing={1}>
                      {Object.entries(selectedStock).slice(0, 4).map(([key, value], index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <MKTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {key}
                          </MKTypography>
                          <MKTypography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                            {value}
                          </MKTypography>
                        </Grid>
                      ))}
                    </Grid>
                  </MKBox>
                )}
              </MKBox>

              {/* 스크롤 가능한 차트 영역 */}
              <MKBox
                sx={{
                  flex: 1,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#a1a1a1',
                    },
                  },
                }}
              >
                {!selectedStock && (
                  <MKBox
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <MKBox
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <MKTypography variant="h4" color="white">
                        📈
                      </MKTypography>
                    </MKBox>
                    <MKTypography variant="h6" color="text.secondary" textAlign="center">
                      종목을 선택하세요
                    </MKTypography>
                    <MKTypography variant="body2" color="text.secondary" textAlign="center">
                      오른쪽 목록에서 종목을 클릭하면
                      <br />
                      캔들스틱 차트가 표시됩니다
                    </MKTypography>
                  </MKBox>
                )}
                
                {selectedStock && (
                  <>
                    {chartLoading ? (
                      <MKBox
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          flexDirection: "column"
                        }}
                      >
                        <CircularProgress size={40} />
                        <MKTypography variant="body2" mt={2} color="text.secondary">
                          차트 데이터를 로드하는 중...
                        </MKTypography>
                      </MKBox>
                    ) : chartData && ohlcvData.length > 0 ? (
                      <MKBox sx={{ p: 2 }}>
                        {/* 차트 헤더 */}
                        <MKBox
                          sx={{
                            mb: 2,
                            pb: 1,
                            borderBottom: "1px solid #f0f0f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <MKBox>
                            <MKTypography variant="h6" fontWeight="bold" color="#667eea">
                              {selectedStock.name}
                            </MKTypography>
                            <MKTypography variant="caption" color="text.secondary">
                              {selectedStock.code} • 최근 63일
                            </MKTypography>
                          </MKBox>
                          
                          {ohlcvData.length > 0 && (
                            <MKBox sx={{ textAlign: "right" }}>
                              <MKTypography variant="h6" fontWeight="bold">
                                {new Intl.NumberFormat('ko-KR').format(ohlcvData[ohlcvData.length - 1]?.close)}
                              </MKTypography>
                              <MKBox sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {ohlcvData.length >= 2 && (
                                  <>
                                    {ohlcvData[ohlcvData.length - 1]?.close >= ohlcvData[ohlcvData.length - 2]?.close ? (
                                      <ArrowUpward sx={{ fontSize: '16px', color: '#f44336' }} />
                                    ) : (
                                      <ArrowDownward sx={{ fontSize: '16px', color: '#2196f3' }} />
                                    )}
                                    <MKTypography 
                                      variant="body2" 
                                      color={ohlcvData[ohlcvData.length - 1]?.close >= ohlcvData[ohlcvData.length - 2]?.close ? '#f44336' : '#2196f3'}
                                      fontWeight="bold"
                                    >
                                      {Math.abs(
                                        ((ohlcvData[ohlcvData.length - 1]?.close - ohlcvData[ohlcvData.length - 2]?.close) / 
                                         ohlcvData[ohlcvData.length - 2]?.close * 100)
                                      ).toFixed(2)}%
                                    </MKTypography>
                                  </>
                                )}
                              </MKBox>
                            </MKBox>
                          )}
                        </MKBox>

                        {/* 캔들스틱 차트 */}
                        <MKBox sx={{ 
                          height: "500px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          p: 1,
                          mb: 2
                        }}>
                          <Chart type="candlestick" data={chartData} options={chartOptions} />
                        </MKBox>
                        
                        {/* 거래량 차트 */}
                        <MKBox sx={{ 
                          height: "200px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          p: 1
                        }}>
                          {volumeData && (
                            <Chart type="bar" data={volumeData} options={volumeOptions} />
                          )}
                        </MKBox>
                      </MKBox>
                    ) : (
                      <MKBox
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          flexDirection: "column",
                          color: "#666"
                        }}
                      >
                        <MKTypography variant="h6" mb={1}>
                          {selectedStock.name}
                        </MKTypography>
                        <MKTypography variant="body2">
                          차트 데이터를 사용할 수 없습니다
                        </MKTypography>
                      </MKBox>
                    )}
                  </>
                )}
              </MKBox>
            </MKBox>
          </Grid>

          {/* 오른쪽 종목 목록 */}
          <Grid item xs={12} md={3} sx={{ 
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            <MKBox
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* 헤더 부분 */}
              <MKBox sx={{ p: 2, flexShrink: 0, borderBottom: "1px solid #e0e0e0" }}>
                <MKTypography variant="h5" textAlign="center">
                  종목 목록 ({stockData.length}개)
                </MKTypography>
              </MKBox>
              
              {loading && (
                <MKBox
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </MKBox>
              )}

              {error && (
                <MKBox
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MKTypography color="error">
                    데이터 로드 중 오류가 발생했습니다: {error}
                  </MKTypography>
                </MKBox>
              )}

              {!loading && !error && stockData.length > 0 && (
                <>
                  {/* 테이블 헤더 */}
                  <MKBox
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  >
                    <Grid container spacing={0}>
                      <Grid item xs={5}>
                        <MKTypography variant="subtitle2" color="white" fontWeight="bold">
                          종목명
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <MKTypography variant="subtitle2" color="white" fontWeight="bold" textAlign="center">
                          RS순위
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <MKTypography variant="subtitle2" color="white" fontWeight="bold" textAlign="center">
                          당기매출
                        </MKTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MKTypography variant="subtitle2" color="white" fontWeight="bold" textAlign="center">
                          영업이익
                        </MKTypography>
                      </Grid>
                    </Grid>
                  </MKBox>

                  {/* 스크롤 가능한 테이블 바디 */}
                  <MKBox
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      backgroundColor: 'white',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                          background: '#a1a1a1',
                        },
                      },
                    }}
                  >
                    {stockData.map((row, rowIndex) => (
                      <MKBox
                        key={row.code || rowIndex}
                        onClick={() => handleStockClick(row)}
                        sx={{
                          p: 1,
                          borderBottom: rowIndex === stockData.length - 1 ? 'none' : '1px solid #f0f0f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: selectedStock?.code === row.code 
                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                            : rowIndex % 2 === 0 ? '#fafafa' : 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.08)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            borderLeft: '3px solid #667eea',
                          },
                          ...(selectedStock?.code === row.code && {
                            borderLeft: '3px solid #667eea',
                            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2)',
                          }),
                        }}
                      >
                        <Grid container spacing={0} alignItems="center">
                          <Grid item xs={5}>
                            <MKBox>
                              <MKTypography 
                                variant="body2" 
                                fontWeight={selectedStock?.code === row.code ? "bold" : "medium"}
                                color={selectedStock?.code === row.code ? "#667eea" : "text.primary"}
                                sx={{
                                  fontSize: '0.8rem',
                                  lineHeight: 1.1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.name || '-'}
                              </MKTypography>
                              <MKTypography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {row.code || ''}
                              </MKTypography>
                            </MKBox>
                          </Grid>
                          <Grid item xs={2.5}>
                            <MKBox display="flex" justifyContent="center">
                              <Chip
                                label={row.rsRank || '-'}
                                size="small"
                                sx={{
                                  backgroundColor: row.rsRank >= 80 ? '#4caf50' : 
                                                 row.rsRank >= 60 ? '#ff9800' : 
                                                 row.rsRank >= 40 ? '#f44336' : '#9e9e9e',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  minWidth: '35px',
                                  height: '20px',
                                }}
                              />
                            </MKBox>
                          </Grid>
                          <Grid item xs={2.5}>
                            <MKBox display="flex" justifyContent="center" alignItems="center" gap={0.3}>
                              {row['당기매출'] > 0 && (
                                <ArrowUpward sx={{ fontSize: '10px', color: '#f44336' }} />
                              )}
                              {row['당기매출'] < 0 && (
                                <ArrowDownward sx={{ fontSize: '10px', color: '#2196f3' }} />
                              )}
                              <MKTypography 
                                variant="body2" 
                                textAlign="center"
                                color={row['당기매출'] > 0 ? '#f44336' : 
                                       row['당기매출'] < 0 ? '#2196f3' : 'text.secondary'}
                                fontWeight="bold"
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {formatNumber(row['당기매출']) || '0'}
                              </MKTypography>
                            </MKBox>
                          </Grid>
                          <Grid item xs={2}>
                            <MKBox display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                              {row['당기영업이익'] > 0 && (
                                <ArrowUpward sx={{ fontSize: '12px', color: '#f44336' }} />
                              )}
                              {row['당기영업이익'] < 0 && (
                                <ArrowDownward sx={{ fontSize: '12px', color: '#2196f3' }} />
                              )}
                              <MKTypography 
                                variant="body2" 
                                textAlign="center"
                                color={row['당기영업이익'] > 0 ? '#f44336' : 
                                       row['당기영업이익'] < 0 ? '#2196f3' : 'text.secondary'}
                                fontWeight="bold"
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {formatNumber(row['당기영업이익']) || '0'}
                              </MKTypography>
                            </MKBox>
                          </Grid>
                        </Grid>
                      </MKBox>
                    ))}
                  </MKBox>
                </>
              )}

              {!loading && !error && stockData.length === 0 && (
                <MKBox
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MKTypography color="text.secondary">
                    데이터가 없습니다.
                  </MKTypography>
                </MKBox>
              )}
            </MKBox>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default Presentation;
