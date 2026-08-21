# 테마 (assets/theme)

이 디렉터리의 파일 상당수는 [Material Kit 2 React](https://www.creative-tim.com/product/material-kit-react)
(Creative Tim, MIT License)에서 유래했다.

MIT 라이선스는 저작물의 상당 부분을 포함하는 사본에 저작권 고지와 허가 고지를
유지할 것을 요구한다. 따라서 **원본 코드가 남아 있는 파일의 헤더 주석은 지우지 않는다.**

내용을 프로젝트 코드로 대체한 파일에서는 헤더를 제거했다.

- `base/colors.js` — 트레이딩 대시보드 팔레트로 전면 재작성
- `base/typography.js` — 타이포 스케일 재정의, Pretendard 도입
- `components/button/index.js` — gradient variant 추가

## 색을 추가할 때

새 색은 반드시 `base/colors.js`에 토큰으로 정의하고 참조한다.
페이지·컴포넌트에 hex를 직접 쓰지 않는다.
차트 색도 `components/TradingViewChart/chartTheme.js`가 이 토큰을 가져다 쓴다.
