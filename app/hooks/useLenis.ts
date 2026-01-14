import {useEffect} from 'react';
import {useLocation} from 'react-router';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function useLenis() {
  const location = useLocation();

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

  // Scroll to top when route changes
  useEffect(() => {
    if (lenisInstance) {
      lenisInstance.scrollTo(0, {immediate: true});
    }
  }, [location.pathname]);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}
