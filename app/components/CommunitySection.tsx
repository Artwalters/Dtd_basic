import {useState, useEffect, type ComponentType} from 'react';

export function CommunitySection() {
  const [CanvasComponent, setCanvasComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Always load the full WebGL canvas (desktop version) on all devices
    import('./CommunityCanvas').then((mod) => {
      setCanvasComponent(() => mod.default);
    });
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
          <button className="btn-glass community-sticky-btn">About Us</button>
        </div>
      </div>

      <div className="community-canvas">
        {CanvasComponent && <CanvasComponent />}
      </div>
      <div className="section-divider section-divider-bottom" />
    </section>
  );
}
