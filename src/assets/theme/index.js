/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import { createTheme } from "@mui/material/styles";
// import Fade from "@mui/material/Fade";

// Material Kit 2 React base styles
import colors from "assets/theme/base/colors";
import breakpoints from "assets/theme/base/breakpoints";
import typography from "assets/theme/base/typography";
import boxShadows from "assets/theme/base/boxShadows";
import borders from "assets/theme/base/borders";
import globals from "assets/theme/base/globals";

// Material Kit 2 React helper functions
import boxShadow from "assets/theme/functions/boxShadow";
import hexToRgb from "assets/theme/functions/hexToRgb";
import linearGradient from "assets/theme/functions/linearGradient";
import pxToRem from "assets/theme/functions/pxToRem";
import rgba from "assets/theme/functions/rgba";

// Material Kit 2 React components base styles for @mui material components
import list from "assets/theme/components/list";
import listItem from "assets/theme/components/list/listItem";
import listItemText from "assets/theme/components/list/listItemText";
import card from "assets/theme/components/card";
import cardMedia from "assets/theme/components/card/cardMedia";
import cardContent from "assets/theme/components/card/cardContent";
import button from "assets/theme/components/button";
import iconButton from "assets/theme/components/iconButton";
import input from "assets/theme/components/form/input";
import inputLabel from "assets/theme/components/form/inputLabel";
import inputOutlined from "assets/theme/components/form/inputOutlined";
import textField from "assets/theme/components/form/textField";
import menu from "assets/theme/components/menu";
import menuItem from "assets/theme/components/menu/menuItem";
import switchButton from "assets/theme/components/form/switchButton";
import divider from "assets/theme/components/divider";
import tableContainer from "assets/theme/components/table/tableContainer";
import tableHead from "assets/theme/components/table/tableHead";
import tableCell from "assets/theme/components/table/tableCell";
import linearProgress from "assets/theme/components/linearProgress";
import breadcrumbs from "assets/theme/components/breadcrumbs";
import slider from "assets/theme/components/slider";
import avatar from "assets/theme/components/avatar";
import tooltip from "assets/theme/components/tooltip";
import appBar from "assets/theme/components/appBar";
import tabs from "assets/theme/components/tabs";
import tab from "assets/theme/components/tabs/tab";
import stepper from "assets/theme/components/stepper";
import step from "assets/theme/components/stepper/step";
import stepConnector from "assets/theme/components/stepper/stepConnector";
import stepLabel from "assets/theme/components/stepper/stepLabel";
import stepIcon from "assets/theme/components/stepper/stepIcon";
import select from "assets/theme/components/form/select";
import formControlLabel from "assets/theme/components/form/formControlLabel";
import formLabel from "assets/theme/components/form/formLabel";
import checkbox from "assets/theme/components/form/checkbox";
import radio from "assets/theme/components/form/radio";
import autocomplete from "assets/theme/components/form/autocomplete";
import flatpickr from "assets/theme/components/flatpickr";
import container from "assets/theme/components/container";
import popover from "assets/theme/components/popover";
import buttonBase from "assets/theme/components/buttonBase";
import icon from "assets/theme/components/icon";
import svgIcon from "assets/theme/components/svgIcon";
import link from "assets/theme/components/link";
import dialog from "assets/theme/components/dialog";
import dialogTitle from "assets/theme/components/dialog/dialogTitle";
import dialogContent from "assets/theme/components/dialog/dialogContent";
import dialogContentText from "assets/theme/components/dialog/dialogContentText";
import dialogActions from "assets/theme/components/dialog/dialogActions";

/** 강조색 위 글자색 (constants/palette.js 의 on-accent 계열과 같은 값) */
const ON_ACCENT = "#ffffff";
const ON_ACCENT_DARK = "#0f172a";

export default createTheme({
  breakpoints: { ...breakpoints },
  /*
   * contrastText 를 직접 정한다.
   *
   * 비워 두면 MUI 가 기본 임계값(3.0)으로 계산해 강조색 위 글자를 전부
   * 흰색으로 넣는다. 밝은 주황(#f59e0b) 위 흰 글자는 대비 2.15 로 읽히지
   * 않는다. 밝기를 재서 흰 글자와 어두운 글자를 갈라 준다.
   * (다크 테마는 assets/theme/dark.js 가 같은 일을 한다.)
   */
  palette: {
    ...colors,
    primary: { ...colors.primary, contrastText: ON_ACCENT },
    secondary: { ...colors.secondary, contrastText: ON_ACCENT },
    info: { ...colors.info, contrastText: ON_ACCENT },
    success: { ...colors.success, contrastText: ON_ACCENT },
    // 밝은 주황 위에는 어두운 글자여야 읽힌다.
    warning: { ...colors.warning, contrastText: ON_ACCENT_DARK },
    error: { ...colors.error, contrastText: ON_ACCENT },
  },
  typography: { ...typography },
  boxShadows: { ...boxShadows },
  borders: { ...borders },
  functions: {
    boxShadow,
    hexToRgb,
    linearGradient,
    pxToRem,
    rgba,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...globals,
        ...flatpickr,
        ...container,
      },
    },
    MuiList: { ...list },
    MuiListItem: { ...listItem },
    MuiListItemText: { ...listItemText },
    MuiCard: { ...card },
    MuiCardMedia: { ...cardMedia },
    MuiCardContent: { ...cardContent },
    MuiButton: { ...button },
    MuiIconButton: { ...iconButton },
    MuiInput: { ...input },
    MuiInputLabel: { ...inputLabel },
    MuiOutlinedInput: { ...inputOutlined },
    MuiTextField: { ...textField },
    MuiMenu: { ...menu },
    MuiMenuItem: { ...menuItem },
    MuiSwitch: { ...switchButton },
    MuiDivider: { ...divider },
    MuiTableContainer: { ...tableContainer },
    MuiTableHead: { ...tableHead },
    MuiTableCell: { ...tableCell },
    MuiLinearProgress: { ...linearProgress },
    MuiBreadcrumbs: { ...breadcrumbs },
    MuiSlider: { ...slider },
    MuiAvatar: { ...avatar },
    MuiTooltip: { ...tooltip },
    MuiAppBar: { ...appBar },
    MuiTabs: { ...tabs },
    MuiTab: { ...tab },
    MuiStepper: { ...stepper },
    MuiStep: { ...step },
    MuiStepConnector: { ...stepConnector },
    MuiStepLabel: { ...stepLabel },
    MuiStepIcon: { ...stepIcon },
    MuiSelect: { ...select },
    MuiFormControlLabel: { ...formControlLabel },
    MuiFormLabel: { ...formLabel },
    MuiCheckbox: { ...checkbox },
    MuiRadio: { ...radio },
    MuiAutocomplete: { ...autocomplete },
    MuiPopover: { ...popover },
    MuiButtonBase: { ...buttonBase },
    MuiIcon: { ...icon },
    MuiSvgIcon: { ...svgIcon },
    MuiLink: { ...link },
    MuiDialog: { ...dialog },
    MuiDialogTitle: { ...dialogTitle },
    MuiDialogContent: { ...dialogContent },
    MuiDialogContentText: { ...dialogContentText },
    MuiDialogActions: { ...dialogActions },
  },
});
