import { useState, useEffect } from "react";

/**
 * Custom hook for managing trading form state and validation
 * Handles trading mode, entry points, stop loss, take profit, pyramiding configuration
 */
export const useTradingForm = (
  selectedStock,
  authenticatedFetch,
  showSnackbar,
  strategyType = "mtt",
  isModal = false
) => {
  // Trading form state
  const [tradingMode, setTradingMode] = useState("manual");
  const [maxLoss, setMaxLoss] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [pyramidingCount, setPyramidingCount] = useState(0);
  const [entryPoint, setEntryPoint] = useState("");
  const [pyramidingEntries, setPyramidingEntries] = useState([]);
  const [positions, setPositions] = useState([100]);

  // Load default values when selected stock changes (모달이 아닌 경우에만)
  useEffect(() => {
    if (selectedStock && !isModal) {
      loadDefaultValues();
    }
  }, [selectedStock, isModal]);

  // 사용자가 설정한 기본 매매 설정값을 불러오는 함수
  const loadDefaultValues = async () => {
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/mypage/trading-defaults/for-new-config`
      );

      if (response.ok) {
        const defaults = await response.json();

        setTradingMode(defaults.trading_mode || "turtle");
        setMaxLoss(defaults.max_loss ? defaults.max_loss.toString() : "");
        setStopLoss(defaults.stop_loss ? defaults.stop_loss.toString() : "");
        setTakeProfit(defaults.take_profit ? defaults.take_profit.toString() : "");
        setPyramidingCount(defaults.pyramiding_count || 0);
        setEntryPoint("");
        setPyramidingEntries(defaults.pyramiding_entries || []);
        setPositions(
          defaults.positions && defaults.positions.length > 0 ? defaults.positions : [100]
        );
      } else {
        // 기본값을 불러올 수 없으면 모든 필드 공란
        setTradingMode("turtle");
        setMaxLoss("");
        setStopLoss("");
        setTakeProfit("");
        setPyramidingCount(0);
        setEntryPoint("");
        setPyramidingEntries([]);
        setPositions([100]);
      }
    } catch (error) {
      // 오류 발생 시 모든 필드 공란
      setTradingMode("turtle");
      setMaxLoss("");
      setStopLoss("");
      setTakeProfit("");
      setPyramidingCount(0);
      setEntryPoint("");
      setPyramidingEntries([]);
      setPositions([100]);
    }
  };

  // Adjust positions array when pyramiding count changes
  useEffect(() => {
    const totalEntries = pyramidingCount + 1;

    const newPositions = Array(totalEntries)
      .fill(0)
      .map((_, index) => {
        if (positions[index] !== undefined) {
          return positions[index];
        } else {
          return 0;
        }
      });
    setPositions(newPositions);
  }, [pyramidingCount]);

  // 매매 방식 변경 시 해당 모드의 기본값을 불러오는 핸들러
  const handleTradingModeChange = async (event) => {
    const newMode = event.target.value;
    setTradingMode(newMode);

    // 선택한 매매 모드에 해당하는 기본값을 MyPage에서 불러와서 적용
    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/mypage/trading-defaults/for-new-config?mode=${newMode}`
      );

      if (response.ok) {
        const defaults = await response.json();

        // 선택한 매매모드의 기본값 적용 (기본값이 없으면 공란)
        setMaxLoss(defaults.max_loss ? defaults.max_loss.toString() : "");
        setStopLoss(defaults.stop_loss ? defaults.stop_loss.toString() : "");
        setTakeProfit(defaults.take_profit ? defaults.take_profit.toString() : "");
        setPyramidingCount(defaults.pyramiding_count || 0);
        setPyramidingEntries(defaults.pyramiding_entries || []);
        setPositions(
          defaults.positions && defaults.positions.length > 0 ? defaults.positions : [100]
        );
      } else {
        // API 호출 실패시 공란으로 초기화
        applyEmptyDefaults();
      }
    } catch (error) {
      // 오류 발생시 공란으로 초기화
      applyEmptyDefaults();
    }
  };

  // 모든 필드를 공란으로 초기화하는 함수
  const applyEmptyDefaults = () => {
    setMaxLoss("");
    setStopLoss("");
    setTakeProfit("");
    setPyramidingCount(0);
    setPyramidingEntries([]);
    setPositions([100]);
  };

  const handlePyramidingCountChange = (event) => {
    const count = parseInt(event.target.value) || 0;
    setPyramidingCount(count);

    const newPyramidingEntries = Array(count)
      .fill("")
      .map((_, index) => pyramidingEntries[index] || "");
    setPyramidingEntries(newPyramidingEntries);
  };

  const handlePyramidingEntryChange = (index, value, shouldUpdateCount = false) => {
    const newPyramidingEntries = [...pyramidingEntries];

    if (shouldUpdateCount) {
      while (newPyramidingEntries.length <= index) {
        newPyramidingEntries.push("");
      }

      const newCount = Math.max(pyramidingCount, index + 1);
      if (newCount !== pyramidingCount) {
        setPyramidingCount(newCount);
      }
    }

    if (index >= 0 && index < newPyramidingEntries.length) {
      newPyramidingEntries[index] = value;
      setPyramidingEntries(newPyramidingEntries);
    }
  };

  const handlePositionChange = (index, value) => {
    const newPositions = [...positions];
    newPositions[index] = parseFloat(value) || 0;
    setPositions(newPositions);
  };

  const handleEqualDivision = () => {
    const totalEntries = pyramidingCount + 1;
    const basePosition = Math.floor(100 / totalEntries);
    const remainder = 100 - basePosition * totalEntries;

    const newPositions = Array(totalEntries)
      .fill(0)
      .map((_, index) => {
        if (index === 0) {
          return basePosition + remainder;
        } else {
          return basePosition;
        }
      });

    setPositions(newPositions);
  };

  // Position sum calculation
  const positionSum = positions.reduce((sum, pos) => sum + (parseFloat(pos) || 0), 0);

  // Form validation
  const getMissingFields = () => {
    const missing = [];

    if (!entryPoint || entryPoint.trim() === "") missing.push("1차 진입시점");
    if (!maxLoss || maxLoss.trim() === "") missing.push("최대손실");
    if (!stopLoss || stopLoss.trim() === "") missing.push("손절");
    if (!takeProfit || takeProfit.trim() === "") missing.push("익절");

    for (let i = 0; i < pyramidingCount; i++) {
      if (!pyramidingEntries[i] || pyramidingEntries[i].trim() === "") {
        missing.push(`${i + 2}차 진입시점`);
      }
    }

    if (Math.abs(positionSum - 100) >= 0.01) {
      missing.push("포지션 합계 (100%가 되어야 함)");
    }

    for (let i = 0; i < positions.length; i++) {
      if (!positions[i] || positions[i] <= 0) {
        missing.push(`${i + 1}차 포지션`);
      }
    }

    return missing;
  };

  const isFormValid = () => {
    return getMissingFields().length === 0;
  };

  // Load configuration from server
  const loadAutobotConfig = async (stockCode, silent = false) => {
    if (!stockCode) return;

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(
        `${apiBaseUrl}/api/mypage/trading-configs/stock/${stockCode}?strategy_type=${strategyType}`
      );

      if (response.ok) {
        const config = await response.json();

        setTradingMode(config.trading_mode || "manual");
        setMaxLoss(config.max_loss ? config.max_loss.toString() : "");
        setStopLoss(config.stop_loss ? config.stop_loss.toString() : "");
        setTakeProfit(config.take_profit ? config.take_profit.toString() : "");
        setPyramidingCount(config.pyramiding_count || 0);

        // 1차 진입시점은 entry_point 필드에서 가져옴
        setEntryPoint(config.entry_point ? config.entry_point.toString() : "");

        // Django DB에서 완전한 데이터 가져옴
        if (config.pyramiding_entries && config.pyramiding_entries.length > 0) {
          setPyramidingEntries(config.pyramiding_entries);
        } else {
          setPyramidingEntries(Array(config.pyramiding_count || 0).fill(""));
        }

        if (config.positions && config.positions.length > 0) {
          setPositions(config.positions.map((pos) => parseFloat(pos)));
        } else {
          const totalEntries = (config.pyramiding_count || 0) + 1;
          const basePosition = Math.floor(100 / totalEntries);
          const remainder = 100 - basePosition * totalEntries;

          const newPositions = Array(totalEntries)
            .fill(0)
            .map((_, index) => {
              if (index === 0) {
                return basePosition + remainder;
              } else {
                return basePosition;
              }
            });
          setPositions(newPositions);
        }

        if (!silent && selectedStock) {
          showSnackbar(
            `${selectedStock.name}(${stockCode})의 기존 설정을 불러왔습니다!`,
            "success"
          );
        }
      } else if (response.status === 404 && !silent && selectedStock) {
        showSnackbar(
          `${selectedStock.name}(${stockCode})에 대한 기존 설정이 없습니다. 새로 설정해주세요.`,
          "info"
        );
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Save configuration to server
  const saveAutotradingConfig = async (autotradingList, navigate) => {
    if (!selectedStock) {
      showSnackbar("종목을 먼저 선택해주세요.", "warning");
      return;
    }

    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      showSnackbar(`다음 항목들을 입력해주세요: ${missingFields.join(", ")}`, "warning");
      return;
    }

    const currentStockConfig = autotradingList.find(
      (item) => item.stock_code === selectedStock.code
    );
    const currentIsActive = currentStockConfig ? currentStockConfig.is_active : true;

    const config = {
      stock_code: selectedStock.code,
      stock_name: selectedStock.name,
      trading_mode: tradingMode,
      strategy_type: strategyType,
      max_loss: maxLoss ? parseFloat(maxLoss) : null,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      pyramiding_count: pyramidingCount,
      entry_point: entryPoint ? parseFloat(entryPoint) : null,
      pyramiding_entries: pyramidingEntries,
      positions: positions,
      is_active: currentIsActive,
    };

    try {
      const apiBaseUrl = window.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await authenticatedFetch(`${apiBaseUrl}/api/mypage/trading-configs`, {
        method: "POST",
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (response.status === 400 || !result.success) {
        if (result.error === "SERVER_SETTINGS_REQUIRED") {
          if (
            window.confirm(
              "autobot 서버 설정을 먼저 완료해주세요.\n\n마이페이지 > 서버 설정에서 autobot 서버 IP와 포트를 설정한 후 자동매매 설정을 저장할 수 있습니다.\n\n지금 서버 설정 페이지로 이동하시겠습니까?"
            )
          ) {
            navigate("/pages/my-page", { state: { activeTab: 1 } });
          }
          return;
        }
        throw new Error(result.message || result.error || "설정 저장에 실패했습니다.");
      }

      if (result.success) {
        showSnackbar(
          "자동매매 설정이 성공적으로 저장되었습니다! Django DB에 저장되고 autobot 서버로 전달되었습니다.",
          "success"
        );
        return true;
      }
    } catch (error) {
      showSnackbar(`설정 저장 실패: ${error.message}`, "error");
      return false;
    }
  };

  // 폼을 기본값으로 초기화하는 함수
  const resetTradingForm = () => {
    if (!isModal) {
      loadDefaultValues();
    }
  };

  // 모달용: 기존 설정으로 폼 초기화하는 함수
  const loadExistingConfig = (config) => {
    if (config) {
      setTradingMode(config.trading_mode || "manual");
      setEntryPoint(config.entry_point ? config.entry_point.toString() : "");
      setMaxLoss(config.max_loss ? config.max_loss.toString() : "");
      setStopLoss(config.stop_loss ? config.stop_loss.toString() : "");
      setTakeProfit(config.take_profit ? config.take_profit.toString() : "");
      setPyramidingCount(config.pyramiding_count || 0);
      setPyramidingEntries(config.pyramiding_entries || []);
      setPositions(config.positions || [100]);
    }
  };

  return {
    // State
    tradingMode,
    maxLoss,
    stopLoss,
    takeProfit,
    pyramidingCount,
    entryPoint,
    pyramidingEntries,
    positions,
    positionSum,

    // Setters
    setTradingMode,
    setMaxLoss,
    setStopLoss,
    setTakeProfit,
    setPyramidingCount,
    setEntryPoint,
    setPyramidingEntries,
    setPositions,

    // Handlers
    handleTradingModeChange,
    handlePyramidingCountChange,
    handlePyramidingEntryChange,
    handlePositionChange,
    handleEqualDivision,

    // Validation
    getMissingFields,
    isFormValid,

    // Configuration
    loadAutobotConfig,
    saveAutotradingConfig,
    resetTradingForm,
    loadExistingConfig, // 모달용 함수 추가
  };
};
