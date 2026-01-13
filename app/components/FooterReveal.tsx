import {useEffect, useRef, lazy, Suspense} from 'react';

const FooterLogo3D = lazy(() => import('~/components/FooterLogo3D'));

export function FooterParallax() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !wrapperRef.current) return;

    let tl: gsap.core.Timeline | null = null;

    const initParallax = async () => {
      const gsapModule = await import('gsap');
      const {ScrollTrigger} = await import('gsap/ScrollTrigger');

      const gsap = gsapModule.default;
      gsap.registerPlugin(ScrollTrigger);

      const el = wrapperRef.current;
      if (!el) return;

      const inner = el.querySelector('[data-footer-parallax-inner]');
      const dark = el.querySelector('[data-footer-parallax-dark]');

      // Refresh ScrollTrigger to recalculate positions
      ScrollTrigger.refresh();

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'clamp(top bottom)',
          end: 'clamp(top top)',
          scrub: 0.5,
        },
      });

      if (inner) {
        tl.from(inner, {
          yPercent: -25,
          ease: 'linear',
        });
      }

      if (dark) {
        tl.from(
          dark,
          {
            opacity: 0.5,
            ease: 'linear',
          },
          '<',
        );
      }
    };

    initParallax();

    return () => {
      if (tl) {
        tl.kill();
      }
      import('gsap/ScrollTrigger').then(({ScrollTrigger}) => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === wrapperRef.current) st.kill();
        });
      });
    };
  }, []);

  return (
    <div ref={wrapperRef} data-footer-parallax="" className="footer-parallax-wrapper">
      <footer data-footer-parallax-inner="" className="footer-parallax">
        <div className="footer-parallax-logo-center">
          <Suspense fallback={null}>
            <FooterLogo3D />
          </Suspense>
        </div>
      </footer>
      <div data-footer-parallax-dark="" className="footer-parallax-dark"></div>
    </div>
  );
}
