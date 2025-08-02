/**
 * FullWidthContainer - Material-UI Container의 너비 제한을 우회하는 컴포넌트
 */

import { Box } from "@mui/material";
import { forwardRef } from "react";

const FullWidthContainer = forwardRef(
  ({ children, sx = {}, disableGutters = false, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          width: "100%",
          maxWidth: "none", // Material-UI Container 제한 제거
          mx: "auto",
          px: disableGutters ? 0 : { xs: 2, sm: 3, md: 4 },
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
