---
version: 1
slug: "frontend-src-pages-mtt"
primary_target: "frontend/src/pages/MTT"
related_targets: []
---

# Surface Brief — MTT 스캐너 (전체 앱 비주얼 월드의 기준 화면)

## Scope & mode

- **Surface**: `frontend/src/pages/MTT` + 그것이 쓰는 표/차트 공통 컴포넌트. 이 화면이 전체 앱 마이그레이션의 기준 월드다.
- **Mode**: Operate. 방문자의 성공 = 조밀한 후보 표를 빠르게 훑고 전략 판정을 읽어 다음 종목으로 넘어가는 것.

## Audience & job

개인 전업 투자자(사실상 본인). 장전·장중, 멀티 모니터. MTT 조건을 만족하는 종목 수십 개를 빠르게 비교하고, 관심 종목을 즐겨찾기/자동매매로 연결한다.

## Must not break

- 표 스캔 속도·정보 밀도 (한 화면 행/열 수, 훑는 속도)
- 상승 적색 / 하락 청색 (국내 시장 관례, 절대 불변)
- 과한 장식·모션 금지 (그라데이션 남용, 시선 빼앗는 애니메이션 없음)
- 기존 라우트·기능·한국어 용어, 라이트/다크 대등

## Direction contract

THESIS: 모든 종목은 기술적 차트북의 한 페이지다 — 격자 가격 패널·RS 라인·여백 주석·짧은 범례. 이 카테고리의 기본값인 '다크 데이터 터미널(흑색 배경·앰버 모노·점멸 티커)'과 소비자 핀테크 카드월을 둘 다 거부한다.

OWN-WORLD: 차트북 페이지 월드. 지면은 제도 필름 느낌의 서늘한 오프화이트(#f4f1ea), 잉크는 근-검정 격자(#141414), 강조는 RS 적색(#8a1c1c)·패널 청색(#1f4e79)·2차 계열 세이지(#9aa39a). 등락 잉크는 국내 관례 적/청. 다크는 차콜 차트-플레이트 지면. 모든 면은 평평(종이), 유일한 깊이는 얇은 격자 괘선과 1px 헤어라인. 라틴/구조 = Archivo(제도·사이니지용 그로테스크), 숫자·티커·기계 음성 = Fragment Mono(tabular), 한글 = Pretendard 유지. 한 크기가 일한다: 단일 스케일, 여백은 제목 위 > 아래.

STORY: 방문자는 화면을 넘겨보는 차트첩으로 이해한다. "이 표는 스프레드시트가 아니라 각 페이지가 판정을 내리는 차트북"임을 믿는다. 등급순 행에서 종목을 고르면 우측에 그 종목의 격자 가격 패널·RS·스테이지 주석이 펼쳐지고, 즐겨찾기/자동매매로 잇는다.

FIRST VIEWPORT: 상단 얇은 챕터 헤더(전략명 · 날짜 · 후보 수, Archivo caps + Fragment Mono 수치). 좌측 5/12: 등급순 후보 '차트-페이지 행' 목록 — 각 행에 종목명·RS 등급 스탬프·핵심 수치(적/청)·미니 스파크 격자. 우측 7/12: 선택 종목의 큰 격자 가격 패널(RS 라인 오버레이, 여백 주석), 아래 짧은 범례와 1차 액션(즐겨찾기 · 자동매매 연결)이 우하단 정착. 필터는 헤더 아래 rule-off 스트립.

FORM: 기술적 차트북 / 스테이지 분석 워크북. 내 등급순 grounded 목록 1위(룰은 index 4=The Blotter를 배정했으나 사용자가 IMPECCABLE'S PICK을 잠금). seed key a6e9317c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction & motion

행 선택 → 우측 차트 패널이 즉시 교체(전환 없음에 가깝게, 100ms 이하 크로스페이드). RS 라인은 패널 로드 시 좌→우로 한 번만 그려진다(1회, 300ms, prefers-reduced-motion 존중). 그 외 모션 없음.

## Unresolved

- 미니 스파크 격자를 lightweight-charts로 그릴지 인라인 SVG로 그릴지 (성능 관찰 필요)
- 다크 차트-플레이트 지면의 정확한 명도
