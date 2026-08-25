/**
 * 전역 상단 네비게이션.
 *
 * Material Kit의 DefaultNavbar에서 실제로 쓰지 않던 변형
 * (transparent · light · relative · center · action)을 걷어낸
 * 프로젝트 소유 컴포넌트다.
 */

import { Fragment, useState, useEffect } from "react";

// react-router components
import { Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Container from "@mui/material/Container";
import Icon from "@mui/material/Icon";
import Popper from "@mui/material/Popper";
import Grow from "@mui/material/Grow";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import Tooltip from "@mui/material/Tooltip";

import AppHeaderDropdown from "components/AppHeader/AppHeaderDropdown";
import { useThemeMode } from "contexts/ThemeModeContext";
import AppHeaderMobile from "components/AppHeader/AppHeaderMobile";

import breakpoints from "assets/theme/base/breakpoints";
import { COLORS, alpha } from "constants/styles";

function AppHeader({ brand, routes, sticky }) {
  const { mode, toggleMode } = useThemeMode();
  const [dropdown, setDropdown] = useState("");
  const [dropdownEl, setDropdownEl] = useState("");
  const [dropdownName, setDropdownName] = useState("");
  const [nestedDropdown, setNestedDropdown] = useState("");
  const [nestedDropdownEl, setNestedDropdownEl] = useState("");
  const [nestedDropdownName, setNestedDropdownName] = useState("");
  const [arrowRef, setArrowRef] = useState(null);
  const [mobileNavbar, setMobileNavbar] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  const openMobileNavbar = () => setMobileNavbar(!mobileNavbar);

  useEffect(() => {
    // 모바일 메뉴 표시 여부를 화면 폭에 따라 결정한다.
    function displayMobileNavbar() {
      if (window.innerWidth < breakpoints.values.lg) {
        setMobileView(true);
        setMobileNavbar(false);
      } else {
        setMobileView(false);
        setMobileNavbar(false);
      }
    }

    /** 
     The event listener that's calling the displayMobileNavbar function when 
     resizing the window.
    */
    window.addEventListener("resize", displayMobileNavbar);

    // Call the displayMobileNavbar function to set the state with the initial value.
    displayMobileNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", displayMobileNavbar);
  }, []);

  const renderNavbarItems = routes.map(({ name, icon, href, route, collapse }) => (
    <AppHeaderDropdown
      key={name}
      name={name}
      icon={icon}
      href={href}
      route={route}
      collapse={Boolean(collapse)}
      onMouseEnter={({ currentTarget }) => {
        if (collapse) {
          setDropdown(currentTarget);
          setDropdownEl(currentTarget);
          setDropdownName(name);
        }
      }}
      onMouseLeave={() => collapse && setDropdown(null)}
      light={true}
    />
  ));

  // Render the routes on the dropdown menu
  const renderRoutes = routes.map(({ name, collapse, columns, rowsPerColumn }) => {
    let template;

    // Render the dropdown menu that should be display as columns
    if (collapse && columns && name === dropdownName) {
      const calculateColumns = collapse.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / rowsPerColumn);

        if (!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = [];
        }

        resultArray[chunkIndex].push(item);

        return resultArray;
      }, []);

      template = (
        <Grid key={name} container spacing={3} py={1} px={1.5}>
          {calculateColumns.map((cols, key) => {
            const gridKey = `grid-${key}`;
            const dividerKey = `divider-${key}`;

            return (
              <Grid key={gridKey} item xs={12 / columns} sx={{ position: "relative" }}>
                {cols.map((col, index) => (
                  <Fragment key={col.name}>
                    <Typography
                      display="block"
                      variant="button"
                      fontWeight="bold"
                      textTransform="capitalize"
                      color={COLORS.TEXT}
                      py={1}
                      px={0.5}
                      mt={index !== 0 ? 2 : 0}
                    >
                      {col.name}
                    </Typography>
                    {col.collapse.map((item) => (
                      <Typography
                        key={item.name}
                        component={item.route ? Link : MuiLink}
                        to={item.route ? item.route : ""}
                        href={item.href ? item.href : (e) => e.preventDefault()}
                        target={item.href ? "_blank" : ""}
                        rel={item.href ? "noreferrer" : "noreferrer"}
                        minWidth="11.25rem"
                        display="block"
                        variant="button"
                        color={COLORS.TEXT}
                        textTransform="capitalize"
                        fontWeight="regular"
                        py={0.625}
                        px={2}
                        sx={({ borders: { borderRadius } }) => ({
                          borderRadius: borderRadius.md,
                          cursor: "pointer",
                          transition: "all 300ms linear",

                          "&:hover": {
                            backgroundColor: COLORS.HOVER_BG,
                            color: COLORS.TEXT,
                          },
                        })}
                      >
                        {item.name}
                      </Typography>
                    ))}
                  </Fragment>
                ))}
                {key !== 0 && (
                  <Divider
                    key={dividerKey}
                    orientation="vertical"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "-4px",
                      transform: "translateY(-45%)",
                      height: "90%",
                    }}
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
      );

      // Render the dropdown menu that should be display as list items
    } else if (collapse && name === dropdownName) {
      template = collapse.map((item) => {
        const linkComponent = {
          component: MuiLink,
          href: item.href,
          target: "_blank",
          rel: "noreferrer",
        };

        const routeComponent = {
          component: Link,
          to: item.route,
        };

        return (
          <Typography
            key={item.name}
            {...(item.route ? routeComponent : linkComponent)}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            variant="button"
            textTransform="capitalize"
            minWidth={item.description ? "14rem" : "12rem"}
            color={COLORS.TEXT}
            fontWeight={item.description ? "bold" : "regular"}
            py={item.description ? 1 : 0.625}
            px={2}
            sx={({ borders: { borderRadius } }) => ({
              borderRadius: borderRadius.md,
              cursor: "pointer",
              transition: "all 300ms linear",

              "&:hover": {
                backgroundColor: COLORS.HOVER_BG,
                color: COLORS.TEXT,

                "& *": {
                  color: COLORS.TEXT,
                },
              },
            })}
            onMouseEnter={({ currentTarget }) => {
              if (item.dropdown) {
                setNestedDropdown(currentTarget);
                setNestedDropdownEl(currentTarget);
                setNestedDropdownName(item.name);
              }
            }}
            onMouseLeave={() => {
              if (item.dropdown) {
                setNestedDropdown(null);
              }
            }}
          >
            {item.description ? (
              <Box>
                {item.name}
                <Typography
                  display="block"
                  variant="button"
                  color={COLORS.TEXT}
                  fontWeight="regular"
                  sx={{ transition: "all 300ms linear" }}
                >
                  {item.description}
                </Typography>
              </Box>
            ) : (
              item.name
            )}
            {item.collapse && (
              <Icon
                fontSize="small"
                sx={{ fontWeight: "normal", verticalAlign: "middle", mr: -0.5 }}
              >
                keyboard_arrow_right
              </Icon>
            )}
          </Typography>
        );
      });
    }

    return template;
  });

  // Routes dropdown menu
  const dropdownMenu = (
    <Popper
      anchorEl={dropdown}
      popperRef={null}
      open={Boolean(dropdown)}
      placement="top-start"
      transition
      style={{ zIndex: 10 }}
      modifiers={[
        {
          name: "arrow",
          enabled: true,
          options: {
            element: arrowRef,
          },
        },
      ]}
      onMouseEnter={() => setDropdown(dropdownEl)}
      onMouseLeave={() => {
        if (!nestedDropdown) {
          setDropdown(null);
          setDropdownName("");
        }
      }}
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          sx={{
            transformOrigin: "left top",
            // 드롭다운 패널. 본문 표면과 같은 색이면 다크에서 메뉴 경계가 사라진다.
            background: COLORS.SURFACE_OVERLAY,
          }}
        >
          <Box>
            <Typography variant="h1" sx={{ color: COLORS.SURFACE_OVERLAY }}>
              <Icon ref={setArrowRef} sx={{ mt: -3 }}>
                arrow_drop_up
              </Icon>
            </Typography>
            <Box
              p={2}
              mt={2}
              sx={({ borders, boxShadows }) => ({
                borderRadius: borders.borderRadius.lg,
                boxShadow: boxShadows.lg,
                border: `1px solid ${COLORS.OVERLAY_BORDER}`,
              })}
            >
              {renderRoutes}
            </Box>
          </Box>
        </Grow>
      )}
    </Popper>
  );

  // Render routes that are nested inside the dropdown menu routes
  const renderNestedRoutes = routes.map(({ collapse, columns }) =>
    collapse && !columns
      ? collapse.map(({ name: parentName, collapse: nestedCollapse }) => {
          let template;

          if (parentName === nestedDropdownName) {
            template =
              nestedCollapse &&
              nestedCollapse.map((item) => {
                const linkComponent = {
                  component: MuiLink,
                  href: item.href,
                  target: "_blank",
                  rel: "noreferrer",
                };

                const routeComponent = {
                  component: Link,
                  to: item.route,
                };

                return (
                  <Typography
                    key={item.name}
                    {...(item.route ? routeComponent : linkComponent)}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    variant="button"
                    textTransform="capitalize"
                    minWidth={item.description ? "14rem" : "12rem"}
                    color={COLORS.TEXT}
                    fontWeight={item.description ? "bold" : "regular"}
                    py={item.description ? 1 : 0.625}
                    px={2}
                    sx={({ borders: { borderRadius } }) => ({
                      borderRadius: borderRadius.md,
                      cursor: "pointer",
                      transition: "all 300ms linear",

                      "&:hover": {
                        backgroundColor: COLORS.HOVER_BG,
                        color: COLORS.TEXT,

                        "& *": {
                          color: COLORS.TEXT,
                        },
                      },
                    })}
                  >
                    {item.description ? (
                      <Box>
                        {item.name}
                        <Typography
                          display="block"
                          variant="button"
                          color={COLORS.TEXT}
                          fontWeight="regular"
                          sx={{ transition: "all 300ms linear" }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    ) : (
                      item.name
                    )}
                    {item.collapse && (
                      <Icon
                        fontSize="small"
                        sx={{ fontWeight: "normal", verticalAlign: "middle", mr: -0.5 }}
                      >
                        keyboard_arrow_right
                      </Icon>
                    )}
                  </Typography>
                );
              });
          }

          return template;
        })
      : null
  );

  // Dropdown menu for the nested dropdowns
  const nestedDropdownMenu = (
    <Popper
      anchorEl={nestedDropdown}
      popperRef={null}
      open={Boolean(nestedDropdown)}
      placement="right-start"
      transition
      style={{ zIndex: 10 }}
      onMouseEnter={() => {
        setNestedDropdown(nestedDropdownEl);
      }}
      onMouseLeave={() => {
        setNestedDropdown(null);
        setNestedDropdownName("");
        setDropdown(null);
      }}
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          sx={{
            transformOrigin: "left top",
            // 드롭다운 패널. 본문 표면과 같은 색이면 다크에서 메뉴 경계가 사라진다.
            background: COLORS.SURFACE_OVERLAY,
          }}
        >
          <Box ml={2.5} mt={-2.5}>
            <Box
              py={1.5}
              px={1}
              mt={2}
              sx={({ borders, boxShadows }) => ({
                borderRadius: borders.borderRadius.lg,
                boxShadow: boxShadows.lg,
                border: `1px solid ${COLORS.OVERLAY_BORDER}`,
              })}
            >
              {renderNestedRoutes}
            </Box>
          </Box>
        </Grow>
      )}
    </Popper>
  );

  return (
    <Container
      maxWidth={false}
      sx={{
        ...(sticky ? { position: "sticky", top: 0, zIndex: 10 } : null),
        px: 1,
      }}
    >
      <Box
        component="nav"
        role="navigation"
        aria-label="Main navigation"
        py={{ xs: 0.5, md: 1 }}
        px={{ xs: 2, sm: 3, lg: 2 }}
        my={{ xs: 1, md: 2 }}
        mx={{ xs: 1, md: 3 }}
        width={{ xs: "calc(100% - 16px)", md: "calc(100% - 48px)" }}
        position="absolute"
        left={0}
        zIndex={3}
        sx={({ palette, borders, boxShadows }) => ({
          color: palette.white.main,
          borderRadius: borders.borderRadius.xl,
          boxShadow: boxShadows.md,
          backgroundImage: `linear-gradient(310deg, var(--dolpha-banner-from), var(--dolpha-banner-to))`,
          backdropFilter: "saturate(200%) blur(30px)",
        })}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box
            component={Link}
            to="/"
            lineHeight={1}
            py={{ xs: 0.5, md: 0.75 }}
            pl={{ xs: 0, lg: 1 }}
          >
            <Typography
              variant="button"
              fontWeight="bold"
              color="white.main"
              sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
            >
              {brand}
            </Typography>
          </Box>
          <Box color="inherit" display={{ xs: "none", lg: "flex" }} ml="auto" mr={0}>
            {renderNavbarItems}
          </Box>
          <Tooltip title={mode === "dark" ? "라이트 모드로" : "다크 모드로"}>
            <Box
              component="button"
              aria-label={mode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
              onClick={toggleMode}
              lineHeight={0}
              color="white.main"
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: { xs: "44px", md: "40px" },
                minHeight: { xs: "44px", md: "40px" },
                ml: { xs: "auto", lg: 1 },
                border: "none",
                borderRadius: 1,
                background: "transparent",
                "&:hover": { backgroundColor: alpha(COLORS.SURFACE, 0.12) },
                "&:focus": { outline: "2px solid #fff", outlineOffset: "2px" },
              }}
            >
              <Icon sx={{ fontSize: "1.25rem" }}>
                {mode === "dark" ? "light_mode" : "dark_mode"}
              </Icon>
            </Box>
          </Tooltip>
          <Box
            component="button"
            aria-label={mobileNavbar ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={mobileNavbar}
            lineHeight={0}
            py={{ xs: 1, md: 1.5 }}
            pl={{ xs: 1, md: 1.5 }}
            color="white.main"
            sx={{
              cursor: "pointer",
              minWidth: { xs: "44px", md: "48px" },
              minHeight: { xs: "44px", md: "48px" },
              display: { xs: "flex", lg: "none" },
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              border: "none",
              background: "transparent",
              "&:hover": {
                backgroundColor: alpha(COLORS.SURFACE, 0.1),
              },
              "&:focus": {
                outline: `2px solid ${COLORS.SURFACE}`,
                outlineOffset: "2px",
              },
            }}
            onClick={openMobileNavbar}
          >
            <Icon sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
              {mobileNavbar ? "close" : "menu"}
            </Icon>
          </Box>
        </Box>
        <Box sx={({ borders }) => ({ borderRadius: borders.borderRadius.xl })}>
          {mobileView && <AppHeaderMobile routes={routes} open={mobileNavbar} />}
        </Box>
      </Box>
      {dropdownMenu}
      {nestedDropdownMenu}
    </Container>
  );
}

AppHeader.defaultProps = {
  brand: "Dolpha",
  sticky: true,
};

AppHeader.propTypes = {
  brand: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.shape).isRequired,
  sticky: PropTypes.bool,
};

export default AppHeader;
