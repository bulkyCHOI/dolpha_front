import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InfoIcon from "@mui/icons-material/Info";
import NewsIcon from "@mui/icons-material/Article";
import EventIcon from "@mui/icons-material/Event";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import routes from "routes";
import { fetchMarketIndices } from "utils/twelveDataApi";

function IssueInfo() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [issueData, setIssueData] = useState({
    marketIndices: [],
    economicNews: [],
    corporateEvents: [],
    lastUpdated: null,
  });

  // 간단한 미니 차트 컴포넌트
  const MiniChart = ({ data, color, width = 120, height = 60 }) => {
    if (!data || data.length === 0) return null;

    const maxPrice = Math.max(...data.map((d) => d.price));
    const minPrice = Math.min(...data.map((d) => d.price));
    const priceRange = maxPrice - minPrice || 1; // 0으로 나누기 방지

    const points = data
      .map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * (width - 10) + 5;
        const y = height - 5 - ((d.price - minPrice) / priceRange) * (height - 10);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <Box
        sx={{
          p: 1.5,
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 2,
          backgroundColor: "#fafafa",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <svg width={width} height={height}>
          {/* 격자 배경 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
          {/* 데이터 포인트 */}
          {data.map((d, i) => {
            const x = (i / Math.max(data.length - 1, 1)) * (width - 10) + 5;
            const y = height - 5 - ((d.price - minPrice) / priceRange) * (height - 10);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i === data.length - 1 ? "3" : "1.5"}
                fill={color}
                opacity={i === data.length - 1 ? 1 : 0.6}
              />
            );
          })}
        </svg>
        <MKTypography
          variant="caption"
          color="text"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 0.5,
            opacity: 0.7,
            fontSize: "0.7rem",
          }}
        >
          30일 추이
        </MKTypography>
      </Box>
    );
  };

  // 차트 데이터 생성 함수
  const generateChartData = (basePrice, days = 30) => {
    const data = [];
    let currentPrice = basePrice;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // 랜덤한 변동률 (-2% ~ +2%)
      const changeRate = (Math.random() - 0.5) * 0.04;
      currentPrice = currentPrice * (1 + changeRate);

      data.push({
        date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
        price: Math.round(currentPrice * 100) / 100,
        fullDate: date.toISOString().split("T")[0],
      });
    }

    return data;
  };

  // 모의 데이터 (뉴스와 이벤트용)
  const mockIssueData = {
    economicNews: [
      {
        id: 1,
        title: "7월 소비자물가지수 발표",
        content: "통계청이 발표한 7월 소비자물가지수가 전년 동월 대비 2.1% 상승했습니다.",
        category: "경제지표",
        importance: "high",
        date: "2025-07-30",
        time: "09:00",
      },
      {
        id: 2,
        title: "코스피 4년 만에 최고치 경신 가능성",
        content:
          "코스피 지수가 연일 상승세를 보이며 4년 만의 최고점 경신 가능성이 높아지고 있습니다.",
        category: "시장동향",
        importance: "high",
        date: "2025-07-30",
        time: "10:30",
      },
      {
        id: 3,
        title: "원달러 환율 1,300원대 후반",
        content: "원달러 환율이 1,380원선에서 거래되며 안정세를 보이고 있습니다.",
        category: "환율",
        importance: "medium",
        date: "2025-07-30",
        time: "11:00",
      },
    ],
    corporateEvents: [
      {
        id: 1,
        company: "삼성전자",
        event: "2분기 실적발표",
        description: "2분기 영업이익 컨센서스 상회 예상",
        date: "2025-07-31",
        impact: "긍정적",
        sector: "반도체",
      },
      {
        id: 2,
        company: "현대자동차",
        event: "신차 출시",
        description: "전기차 신모델 공개 예정",
        date: "2025-08-01",
        impact: "긍정적",
        sector: "자동차",
      },
      {
        id: 3,
        company: "NAVER",
        event: "주주총회",
        description: "정기 주주총회 개최",
        date: "2025-08-05",
        impact: "중립",
        sector: "IT서비스",
      },
    ],
  };

  useEffect(() => {
    loadIssueData();

    // 20분마다 자동 새로고침 (실시간 데이터 업데이트)
    const interval = setInterval(() => {
      loadIssueData();
    }, 15 * 60 * 1000); // 15분 = 15 * 60 * 1000ms

    return () => clearInterval(interval);
  }, []);

  const loadIssueData = async () => {
    setLoading(true);
    try {
      console.log("백엔드 API에서 지수 데이터 가져오는 중...");

      // 백엔드 API에서 실시간 지수 데이터 가져오기
      const marketIndices = await fetchMarketIndices();

      console.log("가져온 지수 데이터:", marketIndices);

      // 경제 뉴스와 기업 이벤트는 기존 모의 데이터 사용
      const updatedData = {
        marketIndices: marketIndices,
        economicNews: mockIssueData.economicNews,
        corporateEvents: mockIssueData.corporateEvents,
        lastUpdated: new Date().toLocaleString(),
      };

      setIssueData(updatedData);
      setLoading(false);
    } catch (error) {
      console.error("이슈 정보 로딩 실패:", error);

      // 에러 발생 시 기존 모의 데이터 사용
      setIssueData({
        ...mockIssueData,
        lastUpdated: new Date().toLocaleString(),
      });
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadIssueData();
  };

  // 한국 주식 시장 색상 기준: 상승=빨간색, 하락=파란색
  const getChangeColor = (change) => {
    if (change > 0) return "error"; // 빨간색 (상승)
    if (change < 0) return "info"; // 파란색 (하락)
    return "text";
  };

  const getChartColor = (change) => {
    if (change >= 0) return theme.palette.error.main; // 빨간색 (상승)
    return theme.palette.info.main; // 파란색 (하락)
  };

  const getChangeIcon = (change) => {
    const iconColor =
      change > 0
        ? theme.palette.error.main
        : change < 0
        ? theme.palette.info.main
        : theme.palette.text.primary;

    if (change > 0) return <TrendingUpIcon fontSize="small" sx={{ color: iconColor }} />;
    if (change < 0) return <TrendingDownIcon fontSize="small" sx={{ color: iconColor }} />;
    return null;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatChange = (change) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${formatNumber(change)}`;
  };

  const formatChangePercent = (changePercent) => {
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${formatNumber(changePercent)}%`;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case "긍정적":
        return "success";
      case "부정적":
        return "error";
      case "중립":
        return "default";
      default:
        return "default";
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <>
        <DefaultNavbar routes={routes} sticky />
        <MKBox
          minHeight="100vh"
          width="100%"
          sx={{
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} color="primary" />
        </MKBox>
      </>
    );
  }

  return (
    <>
      <DefaultNavbar routes={routes} sticky />
      <MKBox
        minHeight="100vh"
        width="100%"
        sx={{
          backgroundColor: "#ffffff",
          pt: 12,
          pb: 4,
        }}
      >
        <Grid container spacing={3} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {/* 헤더 */}
          <Grid item xs={12}>
            <MKBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <MKBox>
                <MKTypography variant="h3" color="dark" fontWeight="bold">
                  이슈 정보
                </MKTypography>
                <MKTypography variant="body2" color="text" mt={1}>
                  주요 지수 15분마다 자동 업데이트(시가총액, 거래대금은 상이)
                </MKTypography>
              </MKBox>
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: "primary.main",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </MKBox>

            {issueData.lastUpdated && (
              <MKTypography variant="caption" color="text" mb={2} sx={{ display: "block" }}>
                마지막 업데이트: {issueData.lastUpdated}
              </MKTypography>
            )}
          </Grid>

          {/* 주요 지수 */}
          <Grid item xs={12}>
            <Card
              sx={{
                mb: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <MKBox display="flex" alignItems="center" mb={3}>
                  <ShowChartIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 28 }} />
                  <MKTypography variant="h5" fontWeight="bold" color="dark">
                    주요 지수
                  </MKTypography>
                </MKBox>

                <Grid container spacing={3}>
                  {issueData.marketIndices.map((index) => (
                    <Grid item xs={12} md={4} key={index.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          border: "1px solid rgba(0,0,0,0.08)",
                          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                            transform: "translateY(-2px)",
                            transition: "all 0.2s ease-in-out",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          {/* 지수 헤더 */}
                          <MKBox
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <MKBox>
                              <MKTypography variant="h6" fontWeight="bold" color="dark">
                                {index.name}
                              </MKTypography>
                              <MKTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                                {index.code}
                              </MKTypography>
                            </MKBox>
                            <MKBox textAlign="right">
                              <MKTypography variant="h6" fontWeight="bold" color="dark">
                                {formatNumber(index.currentPrice)}
                              </MKTypography>
                              <MKBox display="flex" alignItems="center" justifyContent="flex-end">
                                {getChangeIcon(index.change)}
                                <MKTypography
                                  variant="body2"
                                  sx={{
                                    ml: 0.5,
                                    fontWeight: "medium",
                                    color:
                                      index.change > 0
                                        ? theme.palette.error.main
                                        : index.change < 0
                                        ? theme.palette.info.main
                                        : theme.palette.text.primary,
                                  }}
                                >
                                  {formatChange(index.change)} (
                                  {formatChangePercent(index.changePercent)})
                                </MKTypography>
                              </MKBox>
                            </MKBox>
                          </MKBox>

                          {/* 차트 */}
                          <MKBox display="flex" justifyContent="center" sx={{ mb: 2 }}>
                            <MiniChart
                              data={index.chartData}
                              color={getChartColor(index.change)}
                              width={isMobile ? 200 : 240}
                              height={80}
                            />
                          </MKBox>

                          {/* 추가 정보 */}
                          <MKBox>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <MKTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                                  시가총액
                                </MKTypography>
                                <MKTypography variant="body2" fontWeight="medium" color="dark">
                                  {index.marketCap}
                                </MKTypography>
                              </Grid>
                              <Grid item xs={6}>
                                <MKTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                                  거래대금
                                </MKTypography>
                                <MKTypography variant="body2" fontWeight="medium" color="dark">
                                  {index.volume}
                                </MKTypography>
                              </Grid>
                            </Grid>
                            <MKTypography
                              variant="caption"
                              color="text"
                              sx={{ mt: 1.5, display: "block", opacity: 0.8 }}
                            >
                              {index.description}
                            </MKTypography>
                          </MKBox>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 경제 뉴스 */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: "100%",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <MKBox display="flex" alignItems="center" mb={3}>
                  <NewsIcon sx={{ mr: 1.5, color: "info.main", fontSize: 28 }} />
                  <MKTypography variant="h5" fontWeight="bold" color="dark">
                    경제 뉴스
                  </MKTypography>
                </MKBox>

                {issueData.economicNews.map((news, index) => (
                  <MKBox key={news.id} mb={2.5}>
                    <MKBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <MKTypography variant="h6" fontWeight="medium" sx={{ flex: 1 }} color="dark">
                        {news.title}
                      </MKTypography>
                      <Chip
                        label={news.importance}
                        color={getImportanceColor(news.importance)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </MKBox>

                    <MKTypography variant="body2" color="text" mb={1.5} sx={{ opacity: 0.8 }}>
                      {news.content}
                    </MKTypography>

                    <MKBox display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={news.category}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: "rgba(0,0,0,0.12)",
                          color: "text.secondary",
                        }}
                      />
                      <MKTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                        {news.date} {news.time}
                      </MKTypography>
                    </MKBox>

                    {index < issueData.economicNews.length - 1 && (
                      <Divider sx={{ mt: 2.5, opacity: 0.6 }} />
                    )}
                  </MKBox>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* 기업 이벤트 */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: "100%",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <MKBox display="flex" alignItems="center" mb={3}>
                  <EventIcon sx={{ mr: 1.5, color: "warning.main", fontSize: 28 }} />
                  <MKTypography variant="h5" fontWeight="bold" color="dark">
                    기업 이벤트
                  </MKTypography>
                </MKBox>

                {issueData.corporateEvents.map((event, index) => (
                  <MKBox key={event.id} mb={2.5}>
                    <MKBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <MKTypography variant="h6" fontWeight="medium" color="dark">
                        {event.company}
                      </MKTypography>
                      <Chip
                        label={event.impact}
                        color={getImpactColor(event.impact)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </MKBox>

                    <MKTypography variant="subtitle2" color="primary" mb={1} fontWeight="medium">
                      {event.event}
                    </MKTypography>

                    <MKTypography variant="body2" color="text" mb={1.5} sx={{ opacity: 0.8 }}>
                      {event.description}
                    </MKTypography>

                    <MKBox display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={event.sector}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: "rgba(0,0,0,0.12)",
                          color: "text.secondary",
                        }}
                      />
                      <MKTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                        {event.date}
                      </MKTypography>
                    </MKBox>

                    {index < issueData.corporateEvents.length - 1 && (
                      <Divider sx={{ mt: 2.5, opacity: 0.6 }} />
                    )}
                  </MKBox>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* 알림 메시지 */}
          <Grid item xs={12}>
            <Alert
              severity="info"
              sx={{
                mt: 2,
                backgroundColor: "rgba(2, 136, 209, 0.04)",
                border: "1px solid rgba(2, 136, 209, 0.12)",
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  color: "info.main",
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: "bold", color: "dark" }}>정보 안내</AlertTitle>
              <MKTypography variant="body2" color="text" sx={{ opacity: 0.8 }}>
                주요 지수 데이터는 FinanceDataReader를 통해 실시간으로 제공되며, 15분마다 자동
                업데이트됩니다. 투자 결정시 참고용으로만 활용하시기 바랍니다. 투자에 대한 최종
                책임은 투자자 본인에게 있습니다.
              </MKTypography>
            </Alert>
          </Grid>
        </Grid>
      </MKBox>
    </>
  );
}

export default IssueInfo;
