/**
 * 차트 데이터 조회 상수.
 *
 * 120일 이동평균선을 화면 왼쪽 끝까지 그리려면 표시 구간보다 최소 120봉을
 * 더 받아와야 한다. 그래서 조회는 넉넉히 하고, 초기 화면은 최근 구간만 본다.
 */

/** API에서 받아올 봉 수 */
export const CHART_FETCH_LIMIT = 350;

/** 처음 화면에 보여줄 봉 수 (나머지는 좌측으로 스크롤해서 확인) */
export const CHART_INITIAL_VISIBLE_BARS = 150;
