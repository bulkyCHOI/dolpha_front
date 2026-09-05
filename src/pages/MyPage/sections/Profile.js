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
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
              borderRadius: "2px",
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4} md={3} display="flex" justifyContent="center">
                <Avatar
                  src={userInfo.profilePicture}
                  sx={{
                    width: { xs: 100, md: 120 },
                    height: { xs: 100, md: 120 },
                    border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
                    // chartbook: 사진 없을 때 대체 글자 — MUI 기본값(grey/background.default)은
                    // 크림/차콜 어느 한쪽에서 AA 미달. INK 는 테마에 따라 반전(다크에서 밝아짐)돼
                    // 다크 화면에 밝은 원이 튀므로, 테마 불변의 SELECTED_BG/INK 잉크 반전 쌍을 쓴다.
                    bgcolor: COLORS.CHARTBOOK.SELECTED_BG,
                    color: COLORS.CHARTBOOK.SELECTED_INK,
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
                  <Typography variant="h6" mb={1} sx={{ color: COLORS.TEXT_SECONDARY }}>
                    {userInfo.email}
                  </Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent={{ xs: "center", sm: "flex-start" }}
                    gap={1}
                  >
                    <Typography variant="body2" sx={{ color: COLORS.TEXT_SECONDARY }}>
                      가입일: {userInfo.joinDate}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* 정보 편집 카드 */}
        <Grid item xs={12}>
          <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.CHARTBOOK.GROUND, border: `1px solid ${COLORS.CHARTBOOK.GRID}`, borderRadius: "2px" }}>
            <Box mb={3}>
              <Typography variant="h5" mb={1} fontWeight="bold">
                기본 정보
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.TEXT_SECONDARY }}>
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
                      borderRadius: "2px",
                      "&.Mui-focused fieldset": {
                        borderColor: COLORS.CHARTBOOK.INK,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: COLORS.CHARTBOOK.INK,
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
                      borderRadius: "2px",
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
                  // chartbook: INK 는 테마에 따라 반전(다크에서 밝아짐)돼 버튼 채움에 쓰면
                  // 다크 화면에 밝은 사각형이 튄다. 테마 불변의 잉크 반전 쌍을 쓴다.
                  backgroundColor: COLORS.CHARTBOOK.SELECTED_BG,
                  color: COLORS.CHARTBOOK.SELECTED_INK,
                  px: 4,
                  py: 1.5,
                  borderRadius: "2px",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: COLORS.CHARTBOOK.SELECTED_BG,
                    opacity: 0.8,
                  },
                  transition: "all 0.2s ease",
                }}
              >
                저장하기
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
