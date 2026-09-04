import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COLORS } from "constants/styles";

/**
 * 전역 하단 저작권 표기.
 *
 * Material Kit의 DefaultFooter는 브랜드·소셜·메뉴 영역을 갖고 있었지만
 * 이 프로젝트에서는 전부 비어 있었다. 실제로 쓰는 저작권 한 줄만 남긴다.
 */
function AppFooter() {
  return (
    <Box
      component="footer"
      py={3}
      textAlign="center"
      sx={{
        backgroundColor: COLORS.CHARTBOOK.GROUND,
        borderTop: `1px solid ${COLORS.CHARTBOOK.GRID}`,
        color: COLORS.TEXT_SECONDARY,
      }}
    >
      <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY }}>
        Copyright © {new Date().getFullYear()} Dolpha. All rights reserved.
      </Typography>
    </Box>
  );
}

export default AppFooter;
