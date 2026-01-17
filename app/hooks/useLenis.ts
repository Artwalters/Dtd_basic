import {useEffect} from 'react';
import {useLocation} from 'react-router';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let isInitialMount = true;

export function useLenis() {
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
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (isInitialMount) {
      isInitialMount = false;
      return;
    }

    // Reset scroll on navigation
    lenisInstance?.scrollTo(0, {immediate: true});
    window.scrollTo(0, 0);
  }, [pathname]);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}
