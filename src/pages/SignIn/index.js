import React from "react";
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import GoogleLoginButton from "components/GoogleLoginButton";

export default function SignIn() {
  return (
    <MKBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      px={1}
      sx={{ backgroundColor: "#f8f9fa" }}
    >
      <MKBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        maxWidth="400px"
        p={3}
        sx={{
          backgroundColor: "white",
          borderRadius: "lg",
          boxShadow: 3,
        }}
      >
        <MKTypography variant="h4" mb={3}>
          로그인
        </MKTypography>
        <GoogleLoginButton />
      </MKBox>
    </MKBox>
  );
}
