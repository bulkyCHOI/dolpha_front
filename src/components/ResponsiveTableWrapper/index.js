/**
 * ResponsiveTableWrapper - 반응형 테이블 래퍼 컴포넌트
 */

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { COLORS } from "constants/styles";

// 가로 스크롤이 일어나는 실제 요소. 이 안의 생성 콘텐츠(::after)는 스크롤과 함께
// 움직이므로, 우측 고정 페이드는 이 요소 밖(ScrollHint)에 별도로 둔다.
const ScrollArea = styled(Box)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",

  // 테이블 스크롤 영역 스타일링
  "&::-webkit-scrollbar": {
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: COLORS.CHARTBOOK.GRID,
    borderRadius: "0px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: COLORS.CHARTBOOK.INK,
    borderRadius: "0px",
    "&:hover": {
      backgroundColor: COLORS.TEXT_MUTED,
    },
  },

  // 모바일에서는 풀 너비 확보
  [theme.breakpoints.down("xl")]: {
    margin: "0 -16px",
    padding: "0 16px",
    width: "calc(100% + 32px)",
  },

  // 데스크탑에서는 여백 유지
  [theme.breakpoints.up("xl")]: {
    minWidth: "1200px",
  },
}));

// 가로 스크롤 힌트: xl 미만에서 우측 고정 페이드 (스크롤과 함께 움직이지 않음)
const ScrollHint = styled(Box)(({ theme }) => ({
  display: "block",
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0,
  width: "24px",
  background: `linear-gradient(to right, transparent, ${COLORS.CHARTBOOK.GROUND})`,
  pointerEvents: "none",
  [theme.breakpoints.up("xl")]: {
    display: "none",
  },
}));

const TableContainer = styled(Box)({
  position: "relative",
  width: "100%",
  backgroundColor: COLORS.CHARTBOOK.GROUND,
  borderTop: `1px solid ${COLORS.CHARTBOOK.GRID}`,
  borderBottom: `1px solid ${COLORS.CHARTBOOK.GRID}`,
});

const ResponsiveTableWrapper = ({ children, ...props }) => {
  return (
    <TableContainer>
      <ScrollArea {...props}>{children}</ScrollArea>
      <ScrollHint />
    </TableContainer>
  );
};

export default ResponsiveTableWrapper;
