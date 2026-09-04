import PropTypes from "prop-types";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Collapse from "@mui/material/Collapse";
import Icon from "@mui/material/Icon";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COLORS, alpha } from "constants/styles";

function AppHeaderDropdown({
  name,
  icon,
  children,
  collapseStatus,
  light,
  href,
  route,
  collapse,
  ...rest
}) {
  const linkComponent = {
    component: "a",
    href,
    target: "_blank",
    rel: "noreferrer",
  };

  const routeComponent = {
    component: Link,
    to: route,
  };

  return (
    <>
      <Box
        {...rest}
        mx={1}
        p={1}
        display="flex"
        alignItems="baseline"
        sx={{
          cursor: "pointer",
          userSelect: "none",
          color: COLORS.CHARTBOOK.INK,
          borderRadius: "4px",
          transition: "background-color 150ms ease",
          "&:hover": {
            backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.08),
          },
        }}
        {...(route && routeComponent)}
        {...(href && linkComponent)}
      >
        <Typography
          variant="body2"
          lineHeight={1}
          sx={{
            alignSelf: "center",
            "& *": { verticalAlign: "middle" },
            color: COLORS.CHARTBOOK.INK,
          }}
        >
          {icon}
        </Typography>
        <Typography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          sx={{
            fontWeight: "500",
            ml: 1,
            mr: 0.25,
            color: COLORS.CHARTBOOK.INK,
            fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
          }}
        >
          {name}
        </Typography>
        <Typography variant="body2" ml="auto" sx={{ color: COLORS.CHARTBOOK.INK }}>
          <Icon sx={{ fontWeight: "normal", verticalAlign: "middle" }}>
            {collapse && "keyboard_arrow_down"}
          </Icon>
        </Typography>
      </Box>
      {children && (
        <Collapse in={Boolean(collapseStatus)} timeout={400} unmountOnExit>
          {children}
        </Collapse>
      )}
    </>
  );
}

// Setting default values for the props of AppHeaderDropdown
AppHeaderDropdown.defaultProps = {
  children: false,
  collapseStatus: false,
  light: false,
  href: "",
  route: "",
};

// Typechecking props for the AppHeaderDropdown
AppHeaderDropdown.propTypes = {
  name: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node,
  collapseStatus: PropTypes.bool,
  light: PropTypes.bool,
  href: PropTypes.string,
  route: PropTypes.string,
  collapse: PropTypes.bool.isRequired,
};

export default AppHeaderDropdown;
