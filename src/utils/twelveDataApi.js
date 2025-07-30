// FinanceDataReader 기반 백엔드 API를 사용한 주요 지수 데이터 가져오기

// 백엔드 API 엔드포인트 (현재 서버의 8000 포트 사용)
const BACKEND_API_URL = 'http://218.152.32.218:8000/api/market-indices/';

// 메인 함수: 백엔드에서 모든 지수 데이터 가져오기
export const fetchMarketIndices = async () => {
  try {
    console.log('백엔드 FinanceDataReader API에서 지수 데이터 가져오기 시작...');
    
    const response = await fetch(BACKEND_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('백엔드에서 받은 데이터:', data);
    
    if (Array.isArray(data) && data.length > 0) {
      return data;
    } else {
      throw new Error('Invalid data format from backend');
    }
    
  } catch (error) {
    console.error('백엔드 API 호출 실패:', error);
    
    // 백엔드 연결 실패 시 더미 데이터 반환
    return getFullDummyData();
  }
};

// 더미 차트 데이터 생성
const generateDummyChartData = (basePrice, days = 30) => {
  const data = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 랜덤한 변동률 (-1.5% ~ +1.5%)
    const changeRate = (Math.random() - 0.5) * 0.03;
    currentPrice = currentPrice * (1 + changeRate);
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      price: Math.round(currentPrice * 100) / 100,
      fullDate: date.toISOString().split('T')[0]
    });
  }
  
  return data;
};

// 전체 더미 데이터 (백엔드 연결 실패 시)
const getFullDummyData = () => {
  console.log('백엔드 연결 실패 - 전체 더미 데이터 사용');
  return [
    {
      id: 1,
      name: "코스피",
      code: "KOSPI",
      currentPrice: 3249.02,
      high: 3250.13,
      low: 3227.28,
      change: 18.45,
      changePercent: 0.57,
      time: "백엔드 서비스 불가 - 더미 데이터",
      chartData: generateDummyChartData(3230.57),
      marketCap: "2,134조원",
      volume: "8,456억원",
      description: "국내 대표 주가지수",
      currency: "KRW"
    },
    {
      id: 2,
      name: "코스닥",
      code: "KOSDAQ",
      currentPrice: 808.31,
      high: 809.27,
      low: 804.60,
      change: 3.86,
      changePercent: 0.48,
      time: "백엔드 서비스 불가 - 더미 데이터",
      chartData: generateDummyChartData(804.45),
      marketCap: "287조원",
      volume: "6,789억원",
      description: "중소기업 전용 주가지수",
      currency: "KRW"
    },
    {
      id: 3,
      name: "나스닥",
      code: "NASDAQ",
      currentPrice: 21098.29,
      high: 21303.96,
      low: 21081.69,
      change: -80.29,
      changePercent: -0.38,
      time: "백엔드 서비스 불가 - 더미 데이터",
      chartData: generateDummyChartData(21178.58),
      marketCap: "$21.2T",
      volume: "$145.6B",
      description: "미국 기술주 중심 지수",
      currency: "USD"
    }
  ];
};

export default { fetchMarketIndices };
