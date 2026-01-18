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

  return (
    <div ref={triggerRef} className="footer-parallax-wrapper">
      <footer ref={targetRef} className="footer-parallax">
        <div className="footer-parallax-logo-center">
          <Suspense fallback={null}>
            <FooterLogo3D />
          </Suspense>
        </div>
      </footer>
      <div ref={darkRef} className="footer-parallax-dark" />
    </div>
  );
}
