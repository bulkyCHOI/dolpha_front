/**
 * 종목 화면 재무 필터 기본값 설정.
 *
 * 여기서 저장한 값은 MTT · 52주 신고가 화면의 재무 필터에 처음부터 채워진다.
 * 비워 두면 그 조건은 걸지 않는다(= 전체 표시).
 */

import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import useScreenerFilterDefaults from "hooks/useScreenerFilterDefaults";
import {
  EMPTY_FILTERS,
  FINANCIAL_FILTER_FIELDS,
  hasAnyFilterValue,
} from "constants/screenerFilters";
import { COLORS } from "constants/styles";

const ACCENT = COLORS.PRIMARY;
const MUTED = COLORS.TEXT_SECONDARY;

const FIELD_HELP = {
  매출증가율:
    "최근 분기 매출 증가율이 이 값 이상인 종목만 목록에 남습니다. 비우면 조건을 걸지 않습니다.",
  영업이익증가율:
    "최근 분기 영업이익 증가율이 이 값 이상인 종목만 목록에 남습니다. 비우면 조건을 걸지 않습니다.",
  영업이익율: "영업이익률이 이 값 이상인 종목만 목록에 남습니다. 비우면 조건을 걸지 않습니다.",
};

function ScreenerFilterSettings() {
  const { defaults, loading, isLoaded, saveDefaults } = useScreenerFilterDefaults();
  const [values, setValues] = useState(EMPTY_FILTERS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // 서버 값이 도착하면 입력창에 반영한다.
  useEffect(() => {
    if (isLoaded) setValues(defaults);
  }, [isLoaded, defaults]);

  const handleChange = (field, value) => {
    setMessage(null);
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setMessage(null);
    setValues(EMPTY_FILTERS);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveDefaults(values);
    setMessage(
      result.success
        ? { type: "success", text: result.message || "재무 필터 기본값이 저장되었습니다." }
        : { type: "error", text: result.error || "저장에 실패했습니다." }
    );
    setSaving(false);
  };

  return (
    <Card sx={{ borderRadius: 2, backgroundColor: COLORS.SURFACE }}>
      <Box p={{ xs: 2, md: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
            <FilterAltIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              종목 화면 재무 필터
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              여기서 저장한 값이{" "}
              <Box
                component={RouterLink}
                to="/mtt"
                sx={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}
              >
                MTT
              </Box>
              ·{" "}
              <Box
                component={RouterLink}
                to="/weekly-high"
                sx={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}
              >
                52주 신고가
              </Box>{" "}
              화면의 필터에 자동으로 채워집니다.
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
          각 항목은 <strong>입력한 값 이상</strong>인 종목만 남기는 조건입니다. 비워 두면 그 조건은
          적용하지 않습니다.
        </Alert>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {FINANCIAL_FILTER_FIELDS.map(({ field, label }) => (
                <Grid item xs={12} sm={4} key={field}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: COLORS.TEXT }}>
                      {label}
                    </Typography>
                    <Tooltip title={FIELD_HELP[field]} arrow placement="top">
                      <HelpOutlineIcon
                        sx={{ fontSize: 14, color: COLORS.TEXT_MUTED, cursor: "help" }}
                      />
                    </Tooltip>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={values[field] ?? ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder="조건 없음"
                    inputProps={{ step: 1, "aria-label": `${label} 기본 최소값` }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleClear}
                disabled={saving || !hasAnyFilterValue(values)}
                sx={{
                  color: ACCENT,
                  borderColor: ACCENT,
                  "&:hover": { borderColor: ACCENT, backgroundColor: COLORS.TINT_PRIMARY },
                  "&.Mui-disabled": { color: MUTED, borderColor: COLORS.BORDER },
                }}
              >
                모두 비우기
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  color: "#fff",
                  backgroundColor: ACCENT,
                  "&:hover": { backgroundColor: ACCENT },
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </Box>

            {message && (
              <Alert severity={message.type} sx={{ mt: 2, borderRadius: 2 }}>
                {message.text}
              </Alert>
            )}
          </>
        )}
      </Box>
    </Card>
  );
}

export default ScreenerFilterSettings;
