/**
 * 떠 있는 헤더가 차지하는 "띠"의 높이와 스크롤 여부를 알려준다.
 *
 * 헤더 알약(pill)은 position:absolute 라 sticky 컨테이너에 높이를 남기지 않는다.
 * 그래서 알약 위·좌우의 여백으로 본문이 그대로 비쳐 지나가고, 결과적으로
 * "본문이 헤더보다 앞에 있는 것처럼" 보인다. 그 여백까지 덮을 배경을 그리려면
 * 알약의 실제 높이(여백 + 패딩 포함)를 알아야 하는데, 반응형이라 상수로 둘 수 없다.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** 이 정도 스크롤되면 본문이 헤더 뒤로 들어오기 시작한다. */
const SCROLLED_THRESHOLD = 4;

const VERTICAL_BOX_PROPS = ["marginTop", "marginBottom", "paddingTop", "paddingBottom"];

export default function useHeaderBand(sticky) {
  // navRef: 여백·패딩을 읽을 알약 자체. barRef: 접힌 상태의 한 줄(모바일 메뉴 제외).
  const navRef = useRef(null);
  const barRef = useRef(null);
  const [bandHeight, setBandHeight] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const bar = barRef.current;
    if (!nav || !bar) return undefined;

    const measure = () => {
      const styles = window.getComputedStyle(nav);
      const vertical = VERTICAL_BOX_PROPS.reduce(
        (sum, prop) => sum + (parseFloat(styles[prop]) || 0),
        0
      );
      setBandHeight(bar.offsetHeight + vertical);
    };

    measure();

    // 바만 보면 여백·패딩만 바뀌는 브레이크포인트를 놓칠 수 있어 알약도 함께 본다.
    // (모바일 메뉴가 펼쳐져 알약이 커져도 높이는 늘 접힌 한 줄 기준으로 잰다.)
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!sticky) {
      setIsScrolled(false);
      return undefined;
    }

    const handleScroll = () => setIsScrolled(window.scrollY > SCROLLED_THRESHOLD);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  return { navRef, barRef, bandHeight, isScrolled };
}
