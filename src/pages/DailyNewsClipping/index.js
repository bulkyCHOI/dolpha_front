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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArticleIcon from "@mui/icons-material/Article";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import routes from "routes";

function DailyNewsClipping() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 장마감 이슈 샘플 데이터
  const [afterMarketIssues, setAfterMarketIssues] = useState([
    {
      id: 1,
      time: "16:30",
      title: "코스피 2,500선 회복",
      content: "외국인 매수세에 힘입어 코스피가 2,500선을 회복하며 마감했습니다.",
      impact: "positive",
      category: "시장동향",
    },
    {
      id: 2,
      time: "17:00",
      title: "반도체 주가 급등",
      content: "SK하이닉스, 삼성전자 등 반도체 대장주들이 일제히 상승세를 보였습니다.",
      impact: "positive",
      category: "섹터분석",
    },
    {
      id: 3,
      time: "17:30",
      title: "미국 증시 선물 하락",
      content: "인플레이션 우려로 미국 주요 지수 선물이 하락 출발했습니다.",
      impact: "negative",
      category: "해외동향",
    },
  ]);

  // 개장전 이슈 샘플 데이터
  const [preMarketIssues, setPreMarketIssues] = useState([
    {
      id: 1,
      time: "08:00",
      title: "한국은행 기준금리 동결",
      content: "한국은행이 기준금리를 현 수준에서 동결하기로 결정했습니다.",
      impact: "neutral",
      category: "금융정책",
    },
    {
      id: 2,
      time: "08:30",
      title: "경제지표 발표 예정",
      content: "오늘 오후 산업생산지수와 소매판매지수가 발표될 예정입니다.",
      impact: "neutral",
      category: "경제지표",
    },
    {
      id: 3,
      time: "09:00",
      title: "LG에너지솔루션 실적 발표",
      content: "LG에너지솔루션이 오늘 3분기 실적을 발표할 예정입니다.",
      impact: "positive",
      category: "기업공시",
    },
  ]);

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdated(new Date());
    // 실제로는 여기서 API 호출
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      default:
        return "default";
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case "positive":
        return <TrendingUpIcon fontSize="small" />;
      case "negative":
        return <TrendingDownIcon fontSize="small" />;
      default:
        return <ArticleIcon fontSize="small" />;
    }
  };

  const NewsCard = ({ title, issues, cardColor }) => (
    <Card
      sx={{
        height: "100%",
        minHeight: "600px",
        width: "100%",
        border: `2px solid ${cardColor}`,
        borderRadius: 2,
        "&:hover": {
          transform: "translateY(-2px)",
          transition: "transform 0.2s ease-in-out",
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ pb: 2, p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <MKTypography variant="h3" color="dark" fontWeight="bold">
            {title}
          </MKTypography>
          <Chip
            icon={<AccessTimeIcon />}
            label={lastUpdated.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            size="large"
            variant="outlined"
          />
        </Box>

        <Box>
          {issues.map((issue, index) => (
            <Box key={issue.id}>
              <Box display="flex" alignItems="flex-start" gap={4} py={3}>
                <Chip
                  label={issue.time}
                  size="large"
                  sx={{
                    backgroundColor: cardColor,
                    color: "white",
                    minWidth: "80px",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                />
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                    {getImpactIcon(issue.impact)}
                    <MKTypography variant="h5" fontWeight="medium" color="dark">
                      {issue.title}
                    </MKTypography>
                    <Chip
                      label={issue.category}
                      size="large"
                      color={getImpactColor(issue.impact)}
                      variant="outlined"
                    />
                  </Box>
                  <MKTypography
                    variant="h6"
                    color="text"
                    sx={{ lineHeight: 1.8, fontSize: "1.1rem", fontWeight: 400 }}
                  >
                    {issue.content}
                  </MKTypography>
                </Box>
              </Box>
              {index < issues.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "center", pt: 0, pb: 4 }}>
        <Button
          size="large"
          variant="outlined"
          sx={{
            borderColor: cardColor,
            color: cardColor,
            px: 6,
            py: 2,
            fontSize: "1.1rem",
            "&:hover": {
              backgroundColor: cardColor,
              color: "white",
            },
          }}
        >
          더보기
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <>
      <DefaultNavbar routes={routes} sticky />

      <MKBox
        minHeight="100vh"
        width="100%"
        sx={{
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MKBox pt={12} pb={3} px={2}>
          <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: "100%", mx: "auto" }}>
            <Grid item xs={12}>
              {/* 헤더 섹션 */}
              <Box textAlign="center" mb={6}>
                <MKTypography variant="h3" color="dark" mb={2} fontWeight="bold">
                  일간뉴스클리핑
                </MKTypography>
                <MKTypography variant="body1" color="text" mb={2}>
                  주요 증시 이슈와 뉴스를 한눈에 확인하세요
                </MKTypography>

                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`마지막 업데이트: ${lastUpdated.toLocaleString("ko-KR")}`}
                    sx={{
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                      color: "rgba(102, 126, 234, 1)",
                      borderColor: "rgba(102, 126, 234, 0.3)",
                      fontSize: "0.85rem",
                    }}
                    variant="outlined"
                  />
                  <IconButton
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{
                      color: "rgba(102, 126, 234, 1)",
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.2)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: "rgba(102, 126, 234, 1)" }} />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* 뉴스 카드 섹션 */}
              <Grid container spacing={6}>
                {/* 장마감 이슈 카드 */}
                <Grid item xs={12} lg={6}>
                  <NewsCard
                    title="장마감이슈"
                    issues={afterMarketIssues}
                    cardColor={theme.palette.error.main}
                  />
                </Grid>

                {/* 개장전 이슈 카드 */}
                <Grid item xs={12} lg={6}>
                  <NewsCard
                    title="개장전 이슈"
                    issues={preMarketIssues}
                    cardColor={theme.palette.primary.main}
                  />
                </Grid>
              </Grid>

              {/* 추가 정보 섹션 */}
              <Box mt={4}>
                <Alert
                  severity="info"
                  sx={{
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    border: "1px solid rgba(33, 150, 243, 0.2)",
                    "& .MuiAlert-icon": {
                      color: theme.palette.info.main,
                    },
                  }}
                >
                  <AlertTitle>알림</AlertTitle>
                  뉴스 정보는 실시간으로 업데이트되며, 투자 참고용으로만 활용하시기 바랍니다.
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </MKBox>
      </MKBox>
    </>
  );
}

export default DailyNewsClipping;
