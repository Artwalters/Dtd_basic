import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {getLenis} from './useLenis';

gsap.registerPlugin(ScrollTrigger);

export function useHeaderScroll() {
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const header = headerRef.current;
    if (!header) return;

    // Check if we're on the home page (has hero section)
    const isHomePage = window.location.pathname === '/';
    
    if (isHomePage) {
      // Setup scroll-based color changes for home page
      ScrollTrigger.create({
        trigger: document.body,
        start: `${window.innerHeight}px top`,
        onToggle: (self) => {
          if (self.isActive) {
            // Past hero section - dark text with white bg
            header.classList.add('header-dark');
          } else {
            // In hero section - white text, no bg
            header.classList.remove('header-dark');
          }
        },
        refreshPriority: -1
      });

      // Wait for Lenis and update ScrollTrigger
      const checkLenis = setInterval(() => {
        const lenis = getLenis();
        if (lenis) {
          clearInterval(checkLenis);
          lenis.on('scroll', ScrollTrigger.update);
        }
      }, 100);

      return () => {
        clearInterval(checkLenis);
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    } else {
      // Other pages - always dark text with white bg
      header.classList.add('header-dark');
    }
  }, []);

  return headerRef;
}
