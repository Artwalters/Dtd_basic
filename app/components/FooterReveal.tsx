"use client";
import {useEffect, useRef, lazy, Suspense} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

const FooterLogo3D = lazy(() => import('~/components/FooterLogo3D'));

// Register plugin immediately
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function FooterParallax() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!triggerRef.current || !targetRef.current) return;

    // Check if mobile/touch device - skip parallax entirely
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // No parallax on mobile - just show footer normally
    if (isMobile) {
      gsap.set(targetRef.current, { y: 0 });
      if (darkRef.current) {
        gsap.set(darkRef.current, { opacity: 0 });
      }
      return;
    }

    // Desktop only: parallax effect
    const windowHeight = window.innerHeight;
    const parallaxDistance = windowHeight * 0.4;

    const setY = gsap.quickSetter(targetRef.current, 'y', 'px');
    const setOpacity = darkRef.current
      ? gsap.quickSetter(darkRef.current, 'opacity')
      : null;

    timelineRef.current = gsap.timeline({
      scrollTrigger: {
        id: 'footer-parallax',
        trigger: triggerRef.current,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          setY((1 - progress) * -parallaxDistance);
          if (setOpacity) {
            setOpacity((1 - progress) * 0.5);
          }
        },
      },
    });

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      const st = ScrollTrigger.getById('footer-parallax');
      if (st) st.kill();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={triggerRef} className="footer-parallax-wrapper">
      <footer ref={targetRef} className="footer-parallax">
        <div className="footer-parallax-bar">
          <span className="footer-parallax-text">Genesis Collection</span>
          <span className="footer-parallax-text-mobile">Genesis</span>
          <button className="btn-glass footer-parallax-btn" onClick={scrollToTop}>
            <span className="footer-parallax-btn-text">Scroll to top</span>
            <svg className="footer-parallax-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
        <div className="footer-parallax-logo-center">
          <Suspense fallback={null}>
            <FooterLogo3D />
          </Suspense>
        </div>
        <span className="footer-parallax-copyright">©Dare to Dream 2026. All rights reserved.</span>
      </footer>
      <div ref={darkRef} className="footer-parallax-dark" />
    </div>
  );
}
