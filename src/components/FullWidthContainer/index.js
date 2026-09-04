/**
 * FullWidthContainer - Material-UI Container의 너비 제한을 우회하는 컴포넌트
 */

import { Box } from "@mui/material";
import { forwardRef } from "react";

import { LAYOUT, COLORS } from "constants/styles";

const FullWidthContainer = forwardRef(
  ({ children, sx = {}, disableGutters = false, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          width: "100%",
          maxWidth: "none", // Material-UI Container 제한 제거
          mx: "auto",
          px: disableGutters ? 0 : LAYOUT.PAGE_GUTTER,
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          ...sx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

FullWidthContainer.displayName = "FullWidthContainer";

export default FullWidthContainer;
