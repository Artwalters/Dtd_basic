import {useState, useEffect, type ComponentType} from 'react';

export function CommunitySection() {
  const [CanvasComponent, setCanvasComponent] = useState<ComponentType | null>(null);
  const [MobileCarouselComponent, setMobileCarouselComponent] = useState<ComponentType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    // Dynamic import based on device
    if (window.innerWidth <= 768) {
      // Mobile: load lightweight R3F carousel (no 3D model)
      import('./CommunityCarouselMobile').then((mod) => {
        setMobileCarouselComponent(() => mod.CommunityCarouselMobile);
      });
    } else {
      // Desktop: load full WebGL canvas with 3D model
      import('./CommunityCanvas').then((mod) => {
        setCanvasComponent(() => mod.default);
      });
    }
  }, []);

  return (
    <section className="community-section">
      <div className="section-divider-with-title section-divider-top">
        <div className="section-divider-line section-divider-line-left" />
        <h2 className="section-divider-title">Let's Connect</h2>
        <div className="section-divider-line section-divider-line-right" />
      </div>

      <div className="community-sticky-wrapper">
        <div className="community-sticky-content">
          <span className="community-sticky-text">Dream Bigger With Us</span>
          <button className="btn-glass community-sticky-btn">Join Community</button>
        </div>
      </div>

      <div className="community-canvas">
        {isMobile ? (
          MobileCarouselComponent && <MobileCarouselComponent />
        ) : (
          CanvasComponent && <CanvasComponent />
        )}
      </div>
      <div className="section-divider section-divider-bottom" />
    </section>
  );
}
