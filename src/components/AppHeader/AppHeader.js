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
import useHeaderBand from "components/AppHeader/useHeaderBand";

import breakpoints from "assets/theme/base/breakpoints";
import { COLORS, LAYOUT, alpha, Z_INDEX } from "constants/styles";

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
  const { navRef, barRef, bandHeight, isScrolled } = useHeaderBand(sticky);

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
      style={{ zIndex: Z_INDEX.HEADER_MENU }}
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
            background: COLORS.CHARTBOOK.GROUND,
          }}
        >
          <Box>
            <Typography variant="h1" sx={{ color: COLORS.CHARTBOOK.GROUND }}>
              <Icon ref={setArrowRef} sx={{ mt: -3 }}>
                arrow_drop_up
              </Icon>
            </Typography>
            <Box
              p={2}
              mt={2}
              sx={{
                borderRadius: "2px",
                boxShadow: "none",
                border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
              }}
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
      style={{ zIndex: Z_INDEX.HEADER_MENU }}
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
            background: COLORS.CHARTBOOK.GROUND,
          }}
        >
          <Box ml={2.5} mt={-2.5}>
            <Box
              py={1.5}
              px={1}
              mt={2}
              sx={{
                borderRadius: "2px",
                boxShadow: "none",
                border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
              }}
            >
              {renderNestedRoutes}
            </Box>
          </Box>
        </Grow>
      )}
    </Popper>
  );

  return (
    <Box
      sx={{
        // 알약의 위치 기준. MUI Container 는 테마 전역 override 로 폭이
        // 1320px 로 묶여 본문보다 좁아지므로 쓰지 않는다.
        position: sticky ? "sticky" : "relative",
        ...(sticky ? { top: 0, zIndex: Z_INDEX.HEADER } : null),
      }}
    >
      {/*
        알약형 헤더는 absolute 라 위·좌우로 여백이 뚫려 있고, 그 틈으로 본문이
        그대로 지나가 "본문이 헤더 앞에 있다"처럼 보인다. 스크롤이 시작되면
        띠 전체를 화면 폭만큼 덮어 앞뒤 관계를 분명히 한다. 최상단에서는
        투명하게 둬서 히어로 배경 위에 떠 있는 원래 모습을 유지한다.
      */}
      {sticky && (
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: bandHeight,
            zIndex: -1,
            pointerEvents: "none",
            backgroundColor: isScrolled ? COLORS.CHARTBOOK.GROUND : "transparent",
            borderBottom: `1px solid ${isScrolled ? COLORS.CHARTBOOK.GRID : "transparent"}`,
            transition: "background-color 200ms linear, border-color 200ms linear",
          }}
        />
      )}
      <Box
        ref={navRef}
        component="nav"
        role="navigation"
        aria-label="Main navigation"
        py={{ xs: 0.5, md: 1 }}
        px={{ xs: 2, sm: 3, lg: 2 }}
        my={{ xs: 1, md: 2 }}
        mx={LAYOUT.PAGE_GUTTER}
        position="absolute"
        left={0}
        right={0}
        zIndex={3}
        sx={({ palette, borders }) => ({
          color: COLORS.CHARTBOOK.INK,
          borderRadius: borders.borderRadius.xl,
          backgroundColor: COLORS.CHARTBOOK.GROUND,
          border: `1px solid ${COLORS.CHARTBOOK.GRID}`,
          boxShadow: "none",
        })}
      >
        <Box ref={barRef} display="flex" justifyContent="space-between" alignItems="center">
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
              sx={{
                fontSize: { xs: "1rem", md: "1.25rem" },
                color: COLORS.CHARTBOOK.INK,
                fontFamily: "'Archivo', 'Helvetica', 'Arial', sans-serif",
              }}
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
                color: COLORS.CHARTBOOK.INK,
                "&:hover": { backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.08) },
                "&:focus": {
                  outline: `2px solid ${COLORS.CHARTBOOK.INK}`,
                  outlineOffset: "2px",
                },
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
              color: COLORS.CHARTBOOK.INK,
              "&:hover": {
                backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.08),
              },
              "&:focus": {
                outline: `2px solid ${COLORS.CHARTBOOK.INK}`,
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
    </Box>
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
