import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function useLenis() {
  const rafId = useRef<number | null>(null);
  const isFirstRender = useRef(true);
  const {pathname} = useLocation();

  // Initialize Lenis
  useEffect(() => {
    if (typeof window === 'undefined') return;

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenisInstance?.raf(time);
      rafId.current = requestAnimationFrame(raf);
    }

    rafId.current = requestAnimationFrame(raf);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
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
