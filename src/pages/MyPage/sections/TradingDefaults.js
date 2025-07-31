/*
=========================================================
* Material Kit 2 React - MyPage Trading Defaults Section
=========================================================
*/

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

import { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";

function TradingDefaults() {
  const [defaults, setDefaults] = useState({
    trading_mode: "turtle", // 현재 선택된 매매모드
    // Manual 모드 설정
    manual_max_loss: 8.0,
    manual_stop_loss: 8.0,
    manual_take_profit: null,
    manual_pyramiding_count: 0,
    manual_position_size: 100.0,
    manual_positions: [100],
    manual_pyramiding_entries: [],
    manual_use_trailing_stop: true,
    manual_trailing_stop_percent: 8.0,
    // Turtle 모드 설정
    turtle_max_loss: 8.0,
    turtle_stop_loss: 2.0,
    turtle_take_profit: null,
    turtle_pyramiding_count: 3,
    turtle_position_size: 25.0,
    turtle_positions: [25, 25, 25, 25],
    turtle_pyramiding_entries: ["", "", ""],
    turtle_use_trailing_stop: true,
    turtle_trailing_stop_percent: 3.0,
    // 공통 설정
    default_entry_trigger: 1.0,
    default_exit_trigger: 2.0,
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    strategy: true,
    risk: true,
    position: true,
    timing: true,
  });

  const { authenticatedFetch } = useAuth();

  // 매매모드에 따른 단위 표시
  const getUnit = () => {
    return defaults.trading_mode === 'manual' ? '%' : 'ATR';
  };

  // 현재 매매모드에 따른 설정값 가져오기
  const getCurrentModeDefaults = () => {
    const mode = defaults.trading_mode;
    if (mode === 'manual') {
      return {
        max_loss: defaults.manual_max_loss,
        stop_loss: defaults.manual_stop_loss,
        take_profit: defaults.manual_take_profit,
        pyramiding_count: defaults.manual_pyramiding_count,
        position_size: defaults.manual_position_size,
        positions: defaults.manual_positions,
        pyramiding_entries: defaults.manual_pyramiding_entries,
        use_trailing_stop: defaults.manual_use_trailing_stop,
        trailing_stop_percent: defaults.manual_trailing_stop_percent,
      };
    } else {
      return {
        max_loss: defaults.turtle_max_loss,
        stop_loss: defaults.turtle_stop_loss,
        take_profit: defaults.turtle_take_profit,
        pyramiding_count: defaults.turtle_pyramiding_count,
        position_size: defaults.turtle_position_size,
        positions: defaults.turtle_positions,
        pyramiding_entries: defaults.turtle_pyramiding_entries,
        use_trailing_stop: defaults.turtle_use_trailing_stop,
        trailing_stop_percent: defaults.turtle_trailing_stop_percent,
      };
    }
  };

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    setLoading(true);
    try {
      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${baseUrl}/api/mypage/trading-defaults`);

      if (response.ok) {
        const data = await response.json();
        setDefaults(data);
      }
    } catch (error) {
      setMessage({ type: "error", text: `설정 로드 실패: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setMessage(null);

    try {
      const baseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${baseUrl}/api/mypage/trading-defaults`, {
        method: "POST",
        body: JSON.stringify(defaults),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: `저장 실패: ${error.message}` });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setDefaults(prev => {
      const newDefaults = { ...prev };
      const mode = prev.trading_mode;
      
      // 매매모드에 따라 해당 모드의 필드 업데이트
      if (field === 'trading_mode') {
        newDefaults[field] = value;
      } else {
        const modePrefix = mode === 'manual' ? 'manual_' : 'turtle_';
        newDefaults[modePrefix + field] = value;
        
        // 피라미딩 횟수가 변경될 때 포지션 배열 자동 업데이트
        if (field === 'pyramiding_count') {
          const pyramidingCount = parseInt(value) || 0;
          const totalEntries = pyramidingCount + 1;
          const basePosition = Math.floor(100 / totalEntries); // 정수로 내림
          const remainder = 100 - (basePosition * totalEntries); // 나머지 계산
          
          // 새로운 포지션 배열 생성 (정수 균등분할 + 나머지를 1차에 할당)
          const newPositions = Array(totalEntries).fill(basePosition);
          newPositions[0] = basePosition + remainder; // 나머지를 1차에 추가
          newDefaults[modePrefix + 'positions'] = newPositions;
          
          // 피라미딩 진입시점 배열도 업데이트 (2차부터)
          const newPyramidingEntries = Array(pyramidingCount).fill("");
          newDefaults[modePrefix + 'pyramiding_entries'] = newPyramidingEntries;
        }
      }
      
      return newDefaults;
    });
  };

  // 개별 포지션 변경 핸들러
  const handlePositionChange = (index, value) => {
    setDefaults(prev => {
      const mode = prev.trading_mode;
      const modePrefix = mode === 'manual' ? 'manual_' : 'turtle_';
      const positionsField = modePrefix + 'positions';
      
      const newPositions = [...(prev[positionsField] || [])];
      newPositions[index] = parseFloat(value) || 0;
      return { ...prev, [positionsField]: newPositions };
    });
  };

  // 피라미딩 진입시점 변경 핸들러
  const handlePyramidingEntryChange = (index, value) => {
    setDefaults(prev => {
      const mode = prev.trading_mode;
      const modePrefix = mode === 'manual' ? 'manual_' : 'turtle_';
      const entriesField = modePrefix + 'pyramiding_entries';
      
      const newPyramidingEntries = [...(prev[entriesField] || [])];
      newPyramidingEntries[index] = value;
      return { ...prev, [entriesField]: newPyramidingEntries };
    });
  };

  // 균등분할 버튼 핸들러 (정수 처리 + 나머지를 1차에 할당)
  const handleEqualDivision = () => {
    const currentModeDefaults = getCurrentModeDefaults();
    const totalEntries = (currentModeDefaults.pyramiding_count || 0) + 1;
    const basePosition = Math.floor(100 / totalEntries); // 정수로 내림
    const remainder = 100 - (basePosition * totalEntries); // 나머지 계산
    
    const newPositions = Array(totalEntries).fill(basePosition);
    // 나머지를 1차 포지션(인덱스 0)에 추가
    newPositions[0] = basePosition + remainder;
    
    setDefaults(prev => {
      const mode = prev.trading_mode;
      const modePrefix = mode === 'manual' ? 'manual_' : 'turtle_';
      return { ...prev, [modePrefix + 'positions']: newPositions };
    });
  };

  // 초기화 버튼 핸들러 (피라미딩 0회 기준)
  const handleReset = () => {
    const pyramidingCount = 0; // 피라미딩 0회 기준으로 초기화
    const totalEntries = pyramidingCount + 1; // 1차만
    const newPositions = [100]; // 1차에 100% 할당
    const newPyramidingEntries = Array(pyramidingCount).fill("");
    
    setDefaults(prev => {
      const mode = prev.trading_mode;
      const modePrefix = mode === 'manual' ? 'manual_' : 'turtle_';
      return { 
        ...prev,
        [modePrefix + 'pyramiding_count']: pyramidingCount, // 피라미딩 횟수도 0으로 재설정
        [modePrefix + 'positions']: newPositions,
        [modePrefix + 'pyramiding_entries']: newPyramidingEntries
      };
    });
  };

  // 포지션 합계 계산
  const positionSum = getCurrentModeDefaults().positions?.reduce((sum, pos) => sum + (parseFloat(pos) || 0), 0) || 0;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const renderCompactSection = (title, children) => (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <MKBox p={2}>
        <MKTypography variant="h6" fontWeight="600" mb={2}>
          {title}
        </MKTypography>
        {children}
      </MKBox>
    </Card>
  );

  if (loading) {
    return (
      <MKBox display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </MKBox>
    );
  }

  return (
    <MKBox component="section">
      <Grid container spacing={2}>
        {/* 헤더 */}
        <Grid item xs={12}>
          <MKBox mb={2}>
            <MKTypography variant="h5" mb={1} fontWeight="600">
              자동매매 기본설정
            </MKTypography>
            <MKTypography variant="body2" color="text" opacity={0.8}>
              새로운 자동매매 설정 시 사용될 기본값을 관리하세요. 설정된 기본값은 자동매매 설정 생성 시 자동으로 적용됩니다.
            </MKTypography>
          </MKBox>
        </Grid>

        {/* 메시지 표시 */}
        {message && (
          <Grid item xs={12}>
            <Alert severity={message.type} sx={{ borderRadius: 2, mb: 1, whiteSpace: 'pre-line' }}>
              {message.text}
            </Alert>
          </Grid>
        )}

        {/* 좌측 컬럼 */}
        <Grid item xs={12} md={6}>
          {/* 매매모드 선택 */}
          {renderCompactSection("매매모드 선택", (
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={defaults.trading_mode}
                onChange={(e) => handleInputChange("trading_mode", e.target.value)}
              >
                <FormControlLabel 
                  value="manual" 
                  control={<Radio size="small" />} 
                  label="Manual" 
                />
                <FormControlLabel 
                  value="turtle" 
                  control={<Radio size="small" />} 
                  label="Turtle(ATR)" 
                />
              </RadioGroup>
            </FormControl>
          ))}

          {/* 리스크 관리 설정 */}
          {renderCompactSection("리스크 관리 설정", (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="최대손실 (%)"
                  type="number"
                  value={getCurrentModeDefaults().max_loss}
                  onChange={(e) => handleInputChange("max_loss", parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={`손절가 (${getUnit()})`}
                  type="number"
                  value={getCurrentModeDefaults().stop_loss}
                  onChange={(e) => handleInputChange("stop_loss", parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={`익절가 (${getUnit()})`}
                  type="number"
                  value={getCurrentModeDefaults().take_profit || ""}
                  onChange={(e) => handleInputChange("take_profit", e.target.value ? parseFloat(e.target.value) : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={`트레일링 스탑 (${getUnit()})`}
                  type="number"
                  value={getCurrentModeDefaults().trailing_stop_percent}
                  onChange={(e) => handleInputChange("trailing_stop_percent", parseFloat(e.target.value))}
                  disabled={!getCurrentModeDefaults().use_trailing_stop}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={getCurrentModeDefaults().use_trailing_stop}
                      onChange={(e) => handleInputChange("use_trailing_stop", e.target.checked)}
                    />
                  }
                  label="트레일링 스탑 사용"
                />
              </Grid>
            </Grid>
          ))}
        </Grid>

        {/* 우측 컬럼 */}
        <Grid item xs={12} md={6}>

          {/* 포지션 분할 설정 */}
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <MKBox p={2}>
              <MKTypography variant="h6" fontWeight="600" mb={2}>
                포지션 분할 설정
              </MKTypography>
              
              {/* 첫 번째 행: 피라미딩 횟수, 초기화, 균등분할 (6:3:3) */}
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="피라미딩 횟수"
                    type="number"
                    value={getCurrentModeDefaults().pyramiding_count}
                    onChange={(e) => handleInputChange("pyramiding_count", parseInt(e.target.value))}
                    inputProps={{ min: 0, max: 10 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleReset}
                    fullWidth
                    sx={{
                      borderColor: "#f44336",
                      color: "#f44336",
                      fontSize: "0.75rem",
                      "&:hover": {
                        borderColor: "#d32f2f",
                        backgroundColor: "rgba(244, 67, 54, 0.08)",
                      },
                    }}
                  >
                    초기화
                  </Button>
                </Grid>
                <Grid item xs={3}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleEqualDivision}
                    fullWidth
                    sx={{
                      borderColor: "#667eea",
                      color: "#667eea",
                      fontSize: "0.75rem",
                      "&:hover": {
                        borderColor: "#5a6fd8",
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                  >
                    균등분할
                  </Button>
                </Grid>
              </Grid>

              {/* 진입시점과 포지션 설정 (차수별 6:6 배치) */}
              <MKBox mb={2}>
                {/* 1차 진입시점과 포지션 */}
                <Grid container spacing={2} alignItems="center" mb={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="1차 진입시점 (원)"
                      value="진입가격은 자동매매에서 설정"
                      disabled
                      sx={{ 
                        "& .MuiInputBase-input.Mui-disabled": { 
                          color: "rgba(0, 0, 0, 0.6)" 
                        } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="1차 포지션 (%)"
                      type="number"
                      value={getCurrentModeDefaults().positions?.[0] || 0}
                      onChange={(e) => handlePositionChange(0, e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />
                  </Grid>
                </Grid>

                {/* 2차 이상 진입시점과 포지션 (피라미딩 횟수에 따라 동적) */}
                {getCurrentModeDefaults().pyramiding_entries?.map((entry, index) => (
                  <Grid container spacing={2} alignItems="center" mb={1} key={index}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${index + 2}차 진입시점 (${getUnit()})`}
                        type="number"
                        value={entry}
                        onChange={(e) => handlePyramidingEntryChange(index, e.target.value)}
                        placeholder={defaults.trading_mode === 'manual' ? '예: 4' : '예: 1.5'}
                        inputProps={{ step: defaults.trading_mode === 'manual' ? 1 : 0.1 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${index + 2}차 포지션 (%)`}
                        type="number"
                        value={getCurrentModeDefaults().positions?.[index + 1] || 0}
                        onChange={(e) => handlePositionChange(index + 1, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                      />
                    </Grid>
                  </Grid>
                ))}
              </MKBox>
              
              {/* 포지션 합계 표시 */}
              <MKBox display="flex" justifyContent="space-between" alignItems="center">
                <MKTypography variant="body2" color="text">
                  포지션 합계: {positionSum.toFixed(2)}%
                </MKTypography>
                {Math.abs(positionSum - 100) > 0.01 && (
                  <MKTypography variant="body2" color="error">
                    ⚠️ 포지션 합계가 100%가 되어야 합니다
                  </MKTypography>
                )}
              </MKBox>
            </MKBox>
          </Card>

          {/* 버튼 그룹 */}
          <MKBox mt={2} display="flex" justifyContent="flex-end" alignItems="center">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saveLoading}
              size="medium"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                "&:hover": {
                  background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                },
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {saveLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1, color: "white" }} />
                  저장 중...
                </>
              ) : (
                "설정 저장"
              )}
            </Button>
          </MKBox>
        </Grid>
      </Grid>
    </MKBox>
  );
}

export default TradingDefaults;