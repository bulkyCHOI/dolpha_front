/**
 * ResponsiveTableWrapper - 반응형 테이블 래퍼 컴포넌트
 */

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const TableContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",

  // 테이블 스크롤 영역 스타일링
  "&::-webkit-scrollbar": {
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#f1f1f1",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#c1c1c1",
    borderRadius: "4px",
    "&:hover": {
      backgroundColor: "#a8a8a8",
    },
  },

  // 모바일에서는 풀 너비 확보
  [theme.breakpoints.down("lg")]: {
    margin: "0 -16px",
    padding: "0 16px",
    width: "calc(100% + 32px)",
  },

  // 데스크탑에서는 여백 유지
  [theme.breakpoints.up("lg")]: {
    minWidth: "1200px",
  },
}));

const ResponsiveTableWrapper = ({ children, ...props }) => {
  return <TableContainer {...props}>{children}</TableContainer>;
};

export default ResponsiveTableWrapper;
