/**
 * 급등테마주 자동매매 설정.
 *
 * 후보 발굴 기준과 진입 필터를 다루고, 청산은 ThemeSurgeExitSettings 가 담당한다.
 * 청산은 테마가 다음 날 소멸할 수 있다는 전제 아래 당일 매매용 전용 규칙을 기본으로 쓰며,
 * 끄면 기존처럼 Manual 기본 설정을 따른다.
 */

import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Collapse from "@mui/material/Collapse";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { Link as RouterLink } from "react-router-dom";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
import ThemeSurgeExitSettings from "./ThemeSurgeExitSettings";

const ACCENT = "#ef6c00";
const MUTED = "#7b8794";

/** 억 단위 입력 ↔ 원 단위 저장 */
const toEok = (won) => Math.round((won || 0) / 100000000);
const toWon = (eok) => Math.max(0, Math.round((eok || 0) * 100000000));

function FieldLabel({ text, help }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      <MKTypography variant="caption" fontWeight="bold" sx={{ color: "#344767" }}>
        {text}
      </MKTypography>
      <Tooltip title={help} arrow placement="top">
        <HelpOutlineIcon sx={{ fontSize: 14, color: "#b0bac5", cursor: "help" }} />
      </Tooltip>
    </Box>
  );
}

FieldLabel.propTypes = {
  text: PropTypes.string.isRequired,
  help: PropTypes.string.isRequired,
};

function ThemeSurgeSettings({ defaults, onChange }) {
  const enabled = Boolean(defaults.theme_surge_enabled);

  return (
    <Card sx={{ borderRadius: 2, border: enabled ? `1px solid ${ACCENT}55` : "none" }}>
      <MKBox p={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: `${ACCENT}1f`,
                color: ACCENT,
              }}
            >
              <WhatshotIcon fontSize="small" />
            </Box>
            <Box>
              <MKTypography variant="h6" fontWeight="bold">
                급등테마주 자동매매
              </MKTypography>
              <MKTypography variant="caption" sx={{ color: MUTED }}>
                개장일 09:00~15:30, 토스증권 &apos;지금 뜨는 산업&apos;에서 급등 테마의 주도주를
                자동 발굴
              </MKTypography>
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => onChange("theme_surge_enabled", e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: ACCENT,
                  },
                }}
              />
            }
            label={
              <MKTypography
                variant="button"
                fontWeight="bold"
                sx={{ color: enabled ? ACCENT : MUTED }}
              >
                {enabled ? "사용 중" : "사용 안 함"}
              </MKTypography>
            }
            labelPlacement="start"
            sx={{ mr: 0 }}
          />
        </Box>

        <Collapse in={enabled}>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
              1분봉에서 <strong>눌림목 → 전고점 돌파 → 외국인 매수세</strong>가 모두 갖춰질 때
              매수하고, 청산은 아래{" "}
              <strong>전용 규칙(눌림 저점 손절 · nT 분할익절 · 당일 강제청산)</strong>을 따릅니다.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FieldLabel
                  text="동시 추적 종목 수"
                  help="급등테마주 전략으로 동시에 들고 갈 수 있는 최대 종목 수입니다. 한도에 도달하면 새 후보를 등록하지 않습니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={defaults.theme_surge_max_candidates ?? 3}
                  onChange={(e) =>
                    onChange("theme_surge_max_candidates", parseInt(e.target.value, 10) || 1)
                  }
                  inputProps={{ min: 1, max: 10, step: 1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">종목</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FieldLabel
                  text="테마 급등 기준 등락률"
                  help="테마 전체 등락률이 이 값 이상일 때만 후보를 뽑습니다. 낮출수록 후보가 많아지고 노이즈도 늘어납니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={defaults.theme_surge_min_fluctuation ?? 3.0}
                  onChange={(e) =>
                    onChange("theme_surge_min_fluctuation", parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ min: 0, max: 30, step: 0.5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FieldLabel
                  text="테마 최소 거래대금"
                  help="등락률만 높고 수급이 없는 소형 테마를 걸러냅니다. 실제 돈이 들어온 테마만 남깁니다."
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={toEok(defaults.theme_surge_min_trading_value)}
                  onChange={(e) =>
                    onChange("theme_surge_min_trading_value", toWon(parseFloat(e.target.value)))
                  }
                  inputProps={{ min: 0, step: 100 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">억</InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FieldLabel
                  text="외국인 매수세 필터"
                  help="당일 외국인 순매수가 (+)이고 증가 중일 때만 진입합니다. 한국투자증권 REAL 키가 있어야 조회되며, 없으면 진입이 거의 발생하지 않으므로 끄고 운용하세요."
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(defaults.theme_surge_use_foreign_filter)}
                      onChange={(e) => onChange("theme_surge_use_foreign_filter", e.target.checked)}
                    />
                  }
                  label={
                    <MKTypography variant="button" sx={{ color: MUTED }}>
                      {defaults.theme_surge_use_foreign_filter ? "사용" : "미사용"}
                    </MKTypography>
                  }
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>

            <MKTypography
              variant="caption"
              sx={{ display: "block", mt: 2, color: MUTED, lineHeight: 1.6 }}
            >
              · 후보는 <strong>14:30까지만</strong> 신규 등록되며, 장 마감 후(15:32) 끝내 진입하지
              못한 후보는 자동으로 비활성화됩니다.
              <br />· 발굴 현황과 진입 판정 이력은{" "}
              <Box
                component={RouterLink}
                to="/theme-surge"
                sx={{ color: "#667eea", fontWeight: 600, textDecoration: "none" }}
              >
                급등테마주 페이지
              </Box>
              에서 확인할 수 있습니다.
            </MKTypography>

            <ThemeSurgeExitSettings defaults={defaults} onChange={onChange} />
          </Box>
        </Collapse>
      </MKBox>
    </Card>
  );
}

ThemeSurgeSettings.propTypes = {
  defaults: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThemeSurgeSettings;
