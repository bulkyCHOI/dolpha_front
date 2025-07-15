/**
 * 공통 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 억/조 단위로 포맷팅하는 함수
 * @param {number|string} value - 포맷팅할 값
 * @returns {string} 포맷된 문자열
 */
export const formatNumber = (value) => {
  if (!value || value === 0) return '0';
  
  const numValue = Number(value);
  if (isNaN(numValue)) return value;

  const absValue = Math.abs(numValue);
  
  if (absValue >= 1000000000000) { // 조 단위 (1조 = 1,000,000,000,000)
    return `${(numValue / 1000000000000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}조`;
  } else if (absValue >= 100000000) { // 억 단위 (1억 = 100,000,000)
    return `${(numValue / 100000000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}억`;
  } else if (absValue >= 10000) { // 만 단위
    return `${(numValue / 10000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}만`;
  } else {
    return numValue.toLocaleString();
  }
};

/**
 * 재무제표용 금액을 억/조 단위로 포맷팅하는 함수
 * @param {number|string} amount - 포맷팅할 금액
 * @returns {string} 포맷된 문자열
 */
export const formatFinancialAmount = (amount) => {
  if (!amount || amount === 0) return '0';
  
  const numValue = Number(amount);
  if (isNaN(numValue)) return amount;

  const absAmount = Math.abs(numValue);
  
  if (absAmount >= 1000000000000) { // 조 단위
    return `${(numValue / 1000000000000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}조`;
  } else if (absAmount >= 100000000) { // 억 단위
    return `${(numValue / 100000000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}억`;
  } else if (absAmount >= 10000) { // 만 단위
    return `${(numValue / 10000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}만`;
  } else {
    return numValue.toLocaleString();
  }
};

/**
 * KRX 호가단위를 계산하는 함수
 * @param {number|string} price - 가격
 * @returns {number} 호가단위
 */
export const getKRXTickSize = (price) => {
  const numPrice = parseFloat(price) || 0;
  
  if (numPrice < 1000) return 1;
  if (numPrice < 5000) return 5;
  if (numPrice < 10000) return 10;
  if (numPrice < 50000) return 50;
  if (numPrice < 100000) return 100;
  if (numPrice < 500000) return 500;
  return 1000;
};

/**
 * 가격을 KRX 호가단위로 조정하는 함수
 * @param {number|string} price - 조정할 가격
 * @returns {number} 조정된 가격
 */
export const adjustToKRXTickSize = (price) => {
  const numPrice = parseFloat(price) || 0;
  const tickSize = getKRXTickSize(numPrice);
  return Math.round(numPrice / tickSize) * tickSize;
};