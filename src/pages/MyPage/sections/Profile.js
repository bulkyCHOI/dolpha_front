// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";
import { COLORS, alpha } from "constants/styles";

function Profile() {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    profilePicture: "",
    joinDate: "",
  });
  const { user, authenticatedFetch } = useAuth();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
        const response = await authenticatedFetch(`${baseUrl}/api/mypage/profile`);

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        const userData = data.user;

        setUserInfo({
          name:
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.username,
          email: userData.email,
          profilePicture: userData.profile_picture || "",
          joinDate: userData.date_joined
            ? new Date(userData.date_joined).toLocaleDateString("ko-KR")
            : "",
        });
      } catch (error) {
        // 에러 시 AuthContext의 사용자 정보 사용
        if (user) {
          setUserInfo({
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
            email: user.email,
            profilePicture: user.profile_picture || "",
            joinDate: user.date_joined
              ? new Date(user.date_joined).toLocaleDateString("ko-KR")
              : "",
          });
        }
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user, authenticatedFetch]);

  const handleSave = async () => {
    try {
      // 현재 Google 로그인 프로필은 읽기 전용이므로 업데이트를 지원하지 않음
      alert("Google 로그인 사용자의 프로필 정보는 Google 계정에서 관리됩니다.");
    } catch (error) {
      alert("프로필 업데이트에 실패했습니다.");
    }
  };

  return (
    <Box component="section">
      <Grid container spacing={3}>
        {/* 프로필 헤더 카드 */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              background:
                `linear-gradient(135deg, ${alpha(COLORS.PRIMARY, 0.08)} 0%, ${alpha(COLORS.PRIMARY_DARK, 0.08)} 100%)`,
              border: `1px solid ${alpha(COLORS.PRIMARY, 0.1)}`,
              borderRadius: 3,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4} md={3} display="flex" justifyContent="center">
                <Avatar
                  src={userInfo.profilePicture}
                  sx={{
                    width: { xs: 100, md: 120 },
                    height: { xs: 100, md: 120 },
                    border: `4px solid ${alpha(COLORS.PRIMARY, 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(COLORS.PRIMARY, 0.2)}`,
                  }}
                >
                  {userInfo.name ? userInfo.name[0] : "U"}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm={8} md={9}>
                <Box textAlign={{ xs: "center", sm: "left" }}>
                  <Typography variant="h3" mb={1} fontWeight="bold">
                    {userInfo.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" mb={1} opacity={0.8}>
                    {userInfo.email}
                  </Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent={{ xs: "center", sm: "flex-start" }}
                    gap={1}
                  >
                    <Typography variant="body2" color="text.secondary">
                      가입일: {userInfo.joinDate}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* 정보 편집 카드 */}
        <Grid item xs={12}>
          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Box mb={3}>
              <Typography variant="h5" mb={1} fontWeight="bold">
                기본 정보
              </Typography>
              <Typography variant="body2" color="text.secondary" opacity={0.7}>
                Google 계정 정보는 Google에서 관리됩니다
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="이름"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.PRIMARY,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="이메일"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  variant="outlined"
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`,
                  color: COLORS.ON_ACCENT,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${COLORS.PRIMARY_HOVER} 0%, #6a4190 100%)`,
                    transform: "translateY(-1px)",
                    boxShadow: `0 6px 20px ${alpha(COLORS.PRIMARY, 0.3)}`,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                저장하기
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
