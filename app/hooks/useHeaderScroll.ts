import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {getLenis} from './useLenis';

export function useHeaderScroll() {
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const header = headerRef.current;
    if (!header) return;

    // Wait for Lenis to be initialized
    const checkLenis = setInterval(() => {
      const lenis = getLenis();
      if (lenis) {
        clearInterval(checkLenis);
        setupScrollListener(lenis);
      }
    }, 100);

    function setupScrollListener(lenis: any) {
      lenis.on('scroll', ({scroll, direction}: {scroll: number; direction: number}) => {
        // Don't hide header at the top of the page
        if (scroll < 100) {
          if (isHidden.current) {
            gsap.to(header, {
              yPercent: 0,
              duration: 0.3,
              ease: 'power2.out',
            });
            isHidden.current = false;
          }
          lastScrollY.current = scroll;
          return;
        }

        // direction: 1 = scrolling down, -1 = scrolling up
        if (direction === 1 && !isHidden.current) {
          // Scrolling down - hide header
          gsap.to(header, {
            yPercent: -100,
            duration: 0.3,
            ease: 'power2.out',
          });
          isHidden.current = true;
        } else if (direction === -1 && isHidden.current) {
          // Scrolling up - show header
          gsap.to(header, {
            yPercent: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          isHidden.current = false;
        }

        lastScrollY.current = scroll;
      });
    }

    return () => {
      clearInterval(checkLenis);
    };
  }, []);

  return headerRef;
}
