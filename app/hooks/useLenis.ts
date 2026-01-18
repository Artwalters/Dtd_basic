import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

// Check if device is mobile/touch
function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth < 768
  );
}

export function useLenis() {
  const isFirstRender = useRef(true);
  const {pathname} = useLocation();

  // Initialize Lenis with GSAP ticker integration (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip Lenis on mobile/touch devices - native scroll is better
    if (isTouchDevice()) {
      // Still register ScrollTrigger for animations
      import('gsap').then((gsapModule) => {
        import('gsap/ScrollTrigger').then(({ScrollTrigger}) => {
          gsapModule.default.registerPlugin(ScrollTrigger);
        });
      });
      return;
    }

    let tickerCallback: ((time: number) => void) | null = null;

    const initLenis = async () => {
      const gsapModule = await import('gsap');
      const {ScrollTrigger} = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      gsap.registerPlugin(ScrollTrigger);

      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      // Sync Lenis with ScrollTrigger
      lenisInstance.on('scroll', ScrollTrigger.update);

      // Use GSAP ticker to drive Lenis (same timing source)
      tickerCallback = (time: number) => {
        lenisInstance?.raf(time * 1000); // GSAP ticker time is in seconds
      };
      gsap.ticker.add(tickerCallback);

      // Disable GSAP lag smoothing for smoother scrolling
      gsap.ticker.lagSmoothing(0);
    };

    initLenis();

    return () => {
      if (tickerCallback) {
        import('gsap').then((gsapModule) => {
          gsapModule.default.ticker.remove(tickerCallback!);
        });
      }
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);

  // Scroll to top on route change (Lenis overrides ScrollRestoration)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Scroll to top immediately on navigation
    lenisInstance?.scrollTo(0, {immediate: true});
    window.scrollTo(0, 0);
  }, [pathname]);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}
