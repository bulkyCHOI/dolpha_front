import { useState } from "react";

// react-router components
import { Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Collapse from "@mui/material/Collapse";
import MuiLink from "@mui/material/Link";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import AppHeaderDropdown from "components/AppHeader/AppHeaderDropdown";
import { COLORS } from "constants/styles";

function AppHeaderMobile({ routes, open }) {
  const [collapse, setCollapse] = useState("");

  const handleSetCollapse = (name) => (collapse === name ? setCollapse(false) : setCollapse(name));

  const renderNavbarItems = routes.map(
    ({ name, icon, collapse: routeCollapses, href, route, collapse: navCollapse }) => (
      <AppHeaderDropdown
        key={name}
        name={name}
        icon={icon}
        collapseStatus={name === collapse}
        onClick={() => handleSetCollapse(name)}
        href={href}
        route={route}
        collapse={Boolean(navCollapse)}
      >
        <Box sx={{ height: "15rem", maxHeight: "15rem", overflowY: "scroll" }}>
          {routeCollapses &&
            routeCollapses.map((item) => (
              <Box key={item.name} px={2}>
                {item.collapse ? (
                  <>
                    <Typography
                      display="block"
                      variant="button"
                      fontWeight="bold"
                      textTransform="capitalize"
                      color="white"
                      py={1}
                      px={0.5}
                    >
                      {item.name}
                    </Typography>
                    {item.collapse.map((el) => (
                      <Typography
                        key={el.name}
                        component={el.route ? Link : MuiLink}
                        to={el.route ? el.route : ""}
                        href={el.href ? el.href : ""}
                        target={el.href ? "_blank" : ""}
                        rel={el.href ? "noreferrer" : "noreferrer"}
                        minWidth="11.25rem"
                        display="block"
                        variant="button"
                        color="white"
                        textTransform="capitalize"
                        fontWeight="regular"
                        py={0.625}
                        px={2}
                        sx={({ borders: { borderRadius } }) => ({
                          borderRadius: borderRadius.md,
                          cursor: "pointer",
                          transition: "all 300ms linear",

                          // 밝은 회색으로 채우면 다크에서 흰 덩어리로 튄다
                          "&:hover": {
                            backgroundColor: COLORS.HOVER_BG,
                          },
                        })}
                      >
                        {el.name}
                      </Typography>
                    ))}
                  </>
                ) : (
                  <Box
                    key={item.key}
                    display="block"
                    component={item.route ? Link : MuiLink}
                    to={item.route ? item.route : ""}
                    href={item.href ? item.href : ""}
                    target={item.href ? "_blank" : ""}
                    rel={item.href ? "noreferrer" : "noreferrer"}
                    sx={({ borders: { borderRadius } }) => ({
                      borderRadius: borderRadius.md,
                      cursor: "pointer",
                      transition: "all 300ms linear",
                      py: 1,
                      px: 1.625,

                      "&:hover": {
                        backgroundColor: COLORS.HOVER_BG,
                      },
                    })}
                  >
                    <Typography
                      display="block"
                      variant="button"
                      fontWeight="bold"
                      textTransform="capitalize"
                      color="white"
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      display="block"
                      variant="button"
                      color="white"
                      fontWeight="regular"
                      sx={{ transition: "all 300ms linear" }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
        </Box>
      </AppHeaderDropdown>
    )
  );

  return (
    <Collapse in={Boolean(open)} timeout="auto" unmountOnExit>
      <Box width="calc(100% + 1.625rem)" my={2} ml={-2}>
        {renderNavbarItems}
      </Box>
    </Collapse>
  );
}

// Typechecking props for the AppHeaderMobile
AppHeaderMobile.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object])).isRequired,
  open: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
};

export default AppHeaderMobile;
