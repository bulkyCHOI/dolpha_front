/**
 * 계좌 설정 — 사용자별 KIS 계좌 등록/관리 + 전략별 거래 계좌 지정.
 *
 * 이전에는 서버 환경변수로 전 사용자가 같은 계좌를 공유했다.
 * 지금은 사용자가 직접 계좌(실계좌/가상계좌)를 여러 개 등록하고,
 * 전략(MTT, HTF, 급등테마주 등)마다 어떤 계좌로 매매할지 지정할 수 있다.
 * 지정하지 않은 전략은 "기본 계좌"를 따른다.
 */

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import { useAuth } from "contexts/AuthContext";
import { COLORS, onColor } from "constants/styles";

const BASE_URL = window.REACT_APP_API_BASE_URL || "http://localhost:8000";

const EMPTY_FORM = {
  name: "",
  account_type: "VIRTUAL",
  account_no: "",
  account_cd: "01",
  app_key: "",
  app_secret: "",
  is_default: false,
};

function AccountSettings() {
  const { authenticatedFetch } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = 신규 등록
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [strategySavingKey, setStrategySavingKey] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/mypage/account-settings`);
      const result = await response.json();
      if (result.success) {
        setAccounts(result.data.accounts);
        setStrategies(result.data.strategies);
      } else {
        setMessage({ type: "error", text: result.error || "계좌 정보를 불러오지 못했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `계좌 정보 로드 실패: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // ── 계좌 추가/수정 다이얼로그 ──────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      account_type: account.account_type,
      account_no: "", // 마스킹된 값이라 그대로 넣지 않음 — 비워두면 기존 값 유지
      account_cd: account.account_cd,
      app_key: "",
      app_secret: "",
      is_default: account.is_default,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const isEdit = editingId !== null;
      const url = isEdit
        ? `${BASE_URL}/api/mypage/kis-accounts/${editingId}`
        : `${BASE_URL}/api/mypage/kis-accounts`;

      const payload = isEdit
        ? {
            name: form.name,
            account_type: form.account_type,
            ...(form.account_no ? { account_no: form.account_no } : {}),
            account_cd: form.account_cd,
            ...(form.app_key ? { app_key: form.app_key } : {}),
            ...(form.app_secret ? { app_secret: form.app_secret } : {}),
            is_default: form.is_default,
          }
        : form;

      const response = await authenticatedFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: isEdit ? "계좌 정보를 수정했습니다." : "계좌를 등록했습니다.",
        });
        setDialogOpen(false);
        await load();
      } else {
        setMessage({ type: "error", text: result.error || "저장에 실패했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `저장 실패: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (account) => {
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/mypage/kis-accounts/${account.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ is_default: true }),
        }
      );
      const result = await response.json();
      if (result.success) {
        await load();
      } else {
        setMessage({ type: "error", text: result.error || "기본 계좌 변경에 실패했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `기본 계좌 변경 실패: ${error.message}` });
    }
  };

  const handleDelete = async (account) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`'${account.name}' 계좌를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/mypage/kis-accounts/${account.id}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: "계좌를 삭제했습니다." });
        await load();
      } else {
        setMessage({ type: "error", text: result.error || "삭제에 실패했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `삭제 실패: ${error.message}` });
    }
  };

  // ── 전략별 계좌 지정 ───────────────────────────────────────────────────

  const handleStrategyAccountChange = async (strategyType, accountId) => {
    setStrategySavingKey(strategyType);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/mypage/strategy-accounts`, {
        method: "POST",
        body: JSON.stringify({
          strategy_type: strategyType,
          account_id: accountId === "" ? null : accountId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await load();
      } else {
        setMessage({ type: "error", text: result.error || "전략 계좌 지정에 실패했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: `전략 계좌 지정 실패: ${error.message}` });
    } finally {
      setStrategySavingKey(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="120px">
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="h6" fontWeight="bold">
          계좌 설정
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={openCreateDialog}
          sx={{
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            color: onColor("linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"),
            px: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { background: "linear-gradient(135deg, #0d8a7e 0%, #2fd16d 100%)" },
          }}
        >
          계좌 추가
        </Button>
      </Box>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 1.5, borderRadius: 1.5 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* ── 등록된 계좌 목록 ── */}
      {accounts.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>
          등록된 KIS 계좌가 없습니다. &apos;계좌 추가&apos;를 눌러 실계좌 또는 가상계좌를
          등록하세요.
        </Alert>
      ) : (
        <Grid container spacing={1.5} mb={2}>
          {accounts.map((account) => (
            <Grid item xs={12} sm={6} key={account.id}>
              <Box
                sx={{
                  border: `1px solid ${COLORS.BORDER}`,
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  opacity: account.is_active ? 1 : 0.5,
                }}
              >
                <Tooltip title={account.is_default ? "기본 계좌" : "기본 계좌로 지정"}>
                  <IconButton
                    size="small"
                    onClick={() => !account.is_default && handleSetDefault(account)}
                    sx={{ color: account.is_default ? "#f5a623" : COLORS.TEXT_SECONDARY }}
                  >
                    {account.is_default ? (
                      <StarIcon fontSize="small" />
                    ) : (
                      <StarBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Box flexGrow={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {account.name}
                    </Typography>
                    <Chip
                      label={account.account_type === "REAL" ? "실계좌" : "가상계좌"}
                      size="small"
                      color={account.account_type === "REAL" ? "error" : "info"}
                      sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }}
                    />
                    {!account.is_active && (
                      <Chip label="비활성" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: "monospace", letterSpacing: 0.5 }}
                  >
                    {account.account_no} · 앱키 {account.app_key_masked}
                  </Typography>
                </Box>

                <Tooltip title="수정">
                  <IconButton size="small" onClick={() => openEditDialog(account)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                  <IconButton size="small" onClick={() => handleDelete(account)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ── 전략별 계좌 지정 ── */}
      <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
        전략별 거래 계좌
      </Typography>
      <Typography variant="caption" color="text.secondary" opacity={0.75} display="block" mb={1.5}>
        전략마다 다른 계좌로 매매하도록 지정할 수 있습니다. &apos;기본 계좌 사용&apos;으로 두면
        위에서 지정한 기본 계좌(★)를 따릅니다.
      </Typography>

      <Grid container spacing={1.5}>
        {strategies.map((strategy) => (
          <Grid item xs={12} sm={6} key={strategy.strategy_type}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box flexGrow={1} minWidth={0}>
                <Typography variant="body2" fontWeight="medium" noWrap>
                  {strategy.label}
                </Typography>
                {strategy.active_config_count > 0 && (
                  <Typography variant="caption" color="text.secondary" opacity={0.7}>
                    활성 종목 {strategy.active_config_count}개 ·{" "}
                    {strategy.effective_account_name || "계좌 미지정"}
                  </Typography>
                )}
              </Box>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={strategy.account_id ?? ""}
                  displayEmpty
                  disabled={strategySavingKey === strategy.strategy_type || accounts.length === 0}
                  onChange={(e) =>
                    handleStrategyAccountChange(strategy.strategy_type, e.target.value)
                  }
                >
                  <MenuItem value="">
                    <em>
                      기본 계좌 사용
                      {strategy.effective_account_name
                        ? ` (${strategy.effective_account_name})`
                        : ""}
                    </em>
                  </MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.account_type === "REAL" ? "실계좌" : "가상계좌"})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── 계좌 추가/수정 다이얼로그 ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editingId !== null ? "계좌 수정" : "계좌 추가"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField
                label="계좌 별칭"
                fullWidth
                size="small"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 메인 실계좌"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                계좌 종류
              </Typography>
              <ToggleButtonGroup
                value={form.account_type}
                exclusive
                size="small"
                onChange={(_, val) => val && setForm((prev) => ({ ...prev, account_type: val }))}
              >
                <ToggleButton
                  value="VIRTUAL"
                  sx={{ px: 2.5, textTransform: "none", fontWeight: 600 }}
                >
                  가상계좌
                </ToggleButton>
                <ToggleButton value="REAL" sx={{ px: 2.5, textTransform: "none", fontWeight: 600 }}>
                  실계좌
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={8}>
              <TextField
                label="계좌번호"
                fullWidth
                size="small"
                value={form.account_no}
                onChange={(e) => setForm((prev) => ({ ...prev, account_no: e.target.value }))}
                placeholder={editingId !== null ? "변경 시에만 입력" : "예: 12345678"}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="상품코드"
                fullWidth
                size="small"
                value={form.account_cd}
                onChange={(e) => setForm((prev) => ({ ...prev, account_cd: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="앱키(App Key)"
                fullWidth
                size="small"
                type="password"
                value={form.app_key}
                onChange={(e) => setForm((prev) => ({ ...prev, app_key: e.target.value }))}
                placeholder={editingId !== null ? "변경 시에만 입력" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="앱시크릿(App Secret)"
                fullWidth
                size="small"
                type="password"
                value={form.app_secret}
                onChange={(e) => setForm((prev) => ({ ...prev, app_secret: e.target.value }))}
                placeholder={editingId !== null ? "변경 시에만 입력" : ""}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ textTransform: "none" }}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              color: onColor("linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"),
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { background: "linear-gradient(135deg, #0d8a7e 0%, #2fd16d 100%)" },
            }}
          >
            {saving ? <CircularProgress size={16} sx={{ color: COLORS.ON_ACCENT }} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountSettings;
