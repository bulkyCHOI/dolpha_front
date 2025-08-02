/*
=========================================================
* Material Kit 2 React - MyPage Server Settings Section
=========================================================
*/

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

import { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";

function ServerSettings() {
  const [serverInfo, setServerInfo] = useState({
    ip: "",
    port: "8080",
  });
  const [connectionStatus, setConnectionStatus] = useState("unknown"); // unknown, testing, connected, failed
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lastConnectionTime, setLastConnectionTime] = useState(null);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    // 저장된 서버 정보 불러오기
    loadServerSettings();
  }, []);

  const loadServerSettings = async () => {
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/server-settings`);

      if (response.ok) {
        const data = await response.json();
        setServerInfo({
          ip: data.autobot_server_ip || "",
          port: data.autobot_server_port ? String(data.autobot_server_port) : "8080",
        });
        setLastConnectionTime(data.last_connection);
        setConnectionStatus(
          data.server_status === "online"
            ? "connected"
            : data.server_status === "offline"
            ? "unknown"
            : "failed"
        );
      }
    } catch (error) {
      // 서버 설정 로드 실패
    }
  };

  const testConnection = async () => {
    if (!serverInfo.ip || !serverInfo.port) {
      alert("IP 주소와 포트를 입력해주세요.");
      return;
    }

    setLoading(true);
    setConnectionStatus("testing");

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/server-connection-test`, {
        method: "POST",
        body: JSON.stringify({
          ip: serverInfo.ip,
          port: parseInt(serverInfo.port),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus("connected");
        setLastConnectionTime(new Date().toLocaleString());
        alert("서버 연결 성공!");
      } else {
        setConnectionStatus("failed");
        alert("서버 연결 실패: " + result.error);
      }
    } catch (error) {
      setConnectionStatus("failed");
      alert("서버 연결 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!serverInfo.ip || !serverInfo.port) {
      alert("IP 주소와 포트를 입력해주세요.");
      return;
    }

    setSaveLoading(true);

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/server-settings`, {
        method: "POST",
        body: JSON.stringify({
          autobot_server_ip: serverInfo.ip,
          autobot_server_port: parseInt(serverInfo.port),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("서버 설정이 저장되었습니다!");
      } else {
        alert("서버 설정 저장 실패: " + result.error);
      }
    } catch (error) {
      alert("서버 설정 저장에 실패했습니다: " + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusChip = () => {
    switch (connectionStatus) {
      case "connected":
        return <Chip label="연결됨" color="success" size="small" />;
      case "failed":
        return <Chip label="연결 실패" color="error" size="small" />;
      case "testing":
        return <Chip label="테스트 중..." color="warning" size="small" />;
      default:
        return <Chip label="알 수 없음" color="default" size="small" />;
    }
  };

  return (
    <MKBox component="section">
      <Grid container spacing={3}>
        {/* 상태 요약 카드 */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              background:
                connectionStatus === "connected"
                  ? "linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%)"
                  : connectionStatus === "failed"
                  ? "linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(255, 152, 0, 0.08) 100%)"
                  : "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
              border: `1px solid ${
                connectionStatus === "connected"
                  ? "rgba(76, 175, 80, 0.2)"
                  : connectionStatus === "failed"
                  ? "rgba(244, 67, 54, 0.2)"
                  : "rgba(102, 126, 234, 0.1)"
              }`,
              borderRadius: 3,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <MKBox>
                  <MKTypography variant="h4" mb={1} fontWeight="600">
                    Autobot 서버 설정
                  </MKTypography>
                  <MKTypography variant="body1" color="text" opacity={0.8}>
                    개인 자동매매 서버의 IP 주소와 포트를 설정하세요
                  </MKTypography>
                </MKBox>
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
                display="flex"
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
              >
                <MKBox textAlign={{ xs: "left", md: "right" }}>
                  <MKTypography variant="body2" color="text" mb={1}>
                    연결 상태
                  </MKTypography>
                  {getStatusChip()}
                  {lastConnectionTime && (
                    <MKTypography variant="caption" color="text" display="block" mt={1}>
                      마지막 연결: {lastConnectionTime}
                    </MKTypography>
                  )}
                </MKBox>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* 상태 알림 */}
        {connectionStatus === "failed" && (
          <Grid item xs={12}>
            <Alert
              severity="error"
              sx={{
                borderRadius: 2,
                "& .MuiAlert-icon": { fontSize: "1.5rem" },
              }}
            >
              서버 연결에 실패했습니다. IP 주소와 포트를 확인해주세요.
            </Alert>
          </Grid>
        )}

        {connectionStatus === "connected" && (
          <Grid item xs={12}>
            <Alert
              severity="success"
              sx={{
                borderRadius: 2,
                "& .MuiAlert-icon": { fontSize: "1.5rem" },
              }}
            >
              서버가 정상적으로 연결되었습니다.
            </Alert>
          </Grid>
        )}

        {/* 서버 설정 카드 */}
        <Grid item xs={12}>
          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <MKBox mb={3}>
              <MKTypography variant="h5" mb={1} fontWeight="600">
                서버 정보
              </MKTypography>
              <MKTypography variant="body2" color="text" opacity={0.7}>
                Autobot 서버에 연결하기 위한 정보를 입력하세요
              </MKTypography>
            </MKBox>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="서버 IP 주소"
                  placeholder="예: 192.168.1.100"
                  value={serverInfo.ip}
                  onChange={(e) => setServerInfo({ ...serverInfo, ip: e.target.value })}
                  variant="outlined"
                  helperText="autobot 서버가 실행 중인 컴퓨터의 IP 주소"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="포트"
                  value={serverInfo.port}
                  onChange={(e) => setServerInfo({ ...serverInfo, port: e.target.value })}
                  variant="outlined"
                  helperText="기본값: 8080"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#667eea",
                    },
                  }}
                />
              </Grid>
            </Grid>

            <MKBox mt={4} display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={testConnection}
                disabled={loading}
                sx={{
                  borderColor: "#667eea",
                  color: "#667eea",
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  "&:hover": {
                    borderColor: "#5a6fd8",
                    backgroundColor: "rgba(102, 126, 234, 0.08)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1, color: "#667eea" }} />
                    연결 테스트 중...
                  </>
                ) : (
                  "연결 테스트"
                )}
              </Button>
              <Button
                variant="contained"
                onClick={saveSettings}
                disabled={saveLoading}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  "&:hover": {
                    background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.3)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {saveLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1, color: "white" }} />
                    저장 중...
                  </>
                ) : (
                  "설정 저장"
                )}
              </Button>
            </MKBox>
          </Card>
        </Grid>
      </Grid>
    </MKBox>
  );
}

export default ServerSettings;
