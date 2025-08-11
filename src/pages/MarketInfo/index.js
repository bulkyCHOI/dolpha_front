/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React, { useEffect } from "react";

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

function MarketInfo() {
  useEffect(() => {
    // 주식 히트맵 위젯 로드 함수
    const loadStockHeatmap = () => {
      const stockHeatmapScript = document.createElement("script");
      stockHeatmapScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
      stockHeatmapScript.type = "text/javascript";
      stockHeatmapScript.async = true;
      stockHeatmapScript.innerHTML = JSON.stringify({
        exchanges: [],
        dataSource: "SPX500",
        grouping: "sector",
        blockSize: "market_cap_basic",
        blockColor: "change",
        locale: "ko",
        symbolUrl: "",
        colorTheme: "light",
        hasTopBar: false,
        isDataSetEnabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: "100%",
        height: "350"
      });

      const stockContainer = document.getElementById("tradingview_stock_heatmap");
      if (stockContainer && stockContainer.children.length === 0) {
        stockContainer.appendChild(stockHeatmapScript);
      }
    };

    // 암호화폐 히트맵 위젯 로드 함수
    const loadCryptoHeatmap = () => {
      const cryptoHeatmapScript = document.createElement("script");
      cryptoHeatmapScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js";
      cryptoHeatmapScript.type = "text/javascript";
      cryptoHeatmapScript.async = true;
      cryptoHeatmapScript.innerHTML = JSON.stringify({
        dataSource: "Crypto",
        blockSize: "market_cap_calc",
        blockColor: "change",
        locale: "ko",
        symbolUrl: "",
        colorTheme: "light",
        hasTopBar: false,
        isDataSetEnabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: "100%",
        height: "350"
      });

      const cryptoContainer = document.getElementById("tradingview_crypto_heatmap");
      if (cryptoContainer && cryptoContainer.children.length === 0) {
        cryptoContainer.appendChild(cryptoHeatmapScript);
      }
    };

    // TradingView 위젯 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // 첫 번째 위젯 설정 (S&P 500)
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "400",
      symbol: "SPREADEX:SPX",
      interval: "D",
      timezone: "Asia/Seoul",
      theme: "light",
      style: "1",
      locale: "ko",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: "tradingview_sp500",
    });

    const sp500Widget = document.getElementById("tradingview_sp500");
    if (sp500Widget) {
      sp500Widget.appendChild(script.cloneNode(true));
    }

    // 히트맵 위젯들 로드
    setTimeout(() => {
      loadStockHeatmap();
      loadCryptoHeatmap();
    }, 500);

    // 추가 위젯들을 위한 스크립트 로드 함수
    const loadWidget = (containerId, symbol) => {
      const widgetScript = document.createElement("script");
      widgetScript.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      widgetScript.type = "text/javascript";
      widgetScript.async = true;
      widgetScript.innerHTML = JSON.stringify({
        width: "100%",
        height: "400",
        symbol: symbol,
        interval: "D",
        timezone: "Asia/Seoul",
        theme: "light",
        style: "1",
        locale: "ko",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerId,
      });

      const container = document.getElementById(containerId);
      if (container && container.children.length === 0) {
        container.appendChild(widgetScript);
      }
    };

    // 각 위젯 로드
    setTimeout(() => {
      loadWidget("tradingview_nasdaq", "NASDAQ:IXIC");
      loadWidget("tradingview_dji", "SPREADEX:DJI");
      loadWidget("tradingview_nikkei", "SPREADEX:NIKKEI");
      // loadWidget("tradingview_dax", "INDEX:DAX");
      // loadWidget("tradingview_ftse", "INDEX:UKX");
    }, 1000);

    return () => {
      // 컴포넌트 언마운트 시 정리
      const widgets = [
        "tradingview_stock_heatmap",
        "tradingview_crypto_heatmap",
        "tradingview_sp500",
        "tradingview_nasdaq",
        "tradingview_dji",
        "tradingview_nikkei",
        // "tradingview_dax",
        // "tradingview_ftse",
      ];

      widgets.forEach((widgetId) => {
        const widget = document.getElementById(widgetId);
        if (widget) {
          widget.innerHTML = "";
        }
      });
    };
  }, []);

  return (
    <>
      <DefaultNavbar
        routes={routes}
        action={{
          type: "external",
          route: "https://www.creative-tim.com/product/material-kit-react",
          label: "free download",
          color: "info",
        }}
        sticky
      />

      <MKBox component="section" py={12}>
        <Container>
          {/* 히트맵 섹션 */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} lg={12}>
              <MKTypography variant="h2" color="dark" mb={2} textAlign="center">
                시장 히트맵
              </MKTypography>
              <MKTypography variant="body1" color="text" mb={4} textAlign="center">
                주식과 암호화폐 시장의 실시간 히트맵을 확인하세요
              </MKTypography>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 8 }}>
            {/* 주식 히트맵 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    S&P 500 히트맵
                  </Typography>
                  <Box id="tradingview_stock_heatmap" sx={{ height: 350 }} />
                </CardContent>
              </Card>
            </Grid>

            {/* 비트코인/암호화폐 히트맵 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    암호화폐 히트맵
                  </Typography>
                  <Box id="tradingview_crypto_heatmap" sx={{ height: 350 }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 10 }}>
            <Grid item xs={12} lg={12}>
              <MKTypography variant="h2" color="dark" mb={2} textAlign="center">
                세계 주요 지수
              </MKTypography>
              <MKTypography variant="body1" color="text" mb={6} textAlign="center">
                실시간 글로벌 주식 시장 지수를 확인하세요
              </MKTypography>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* S&P 500 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    S&P 500
                  </Typography>
                  <Box id="tradingview_sp500" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid>

            {/* NASDAQ */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    NASDAQ
                  </Typography>
                  <Box id="tradingview_nasdaq" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid>

            {/* 다우 산업 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    다우 산업
                  </Typography>
                  <Box id="tradingview_dji" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid>

            {/* KOSPI */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    Nikkei 225
                  </Typography>
                  <Box id="tradingview_nikkei" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid>

            {/* DAX */}
            {/* <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    DAX
                  </Typography>
                  <Box id="tradingview_dax" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid> */}

            {/* FTSE 100 */}
            {/* <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    color="primary"
                    textAlign="center"
                  >
                    FTSE 100
                  </Typography>
                  <Box id="tradingview_ftse" sx={{ height: 400 }} />
                </CardContent>
              </Card>
            </Grid> */}
          </Grid>
        </Container>
      </MKBox>

      <MKBox pt={6} px={1} mt={6}>
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default MarketInfo;
