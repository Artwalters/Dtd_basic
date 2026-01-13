import {useState, useEffect, type ComponentType} from 'react';

export function CommunitySection() {
  const [CanvasComponent, setCanvasComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import only on client side
    import('./CommunityCanvas').then((mod) => {
      setCanvasComponent(() => mod.default);
    });
  }, []);

  return (
    <section className="community-section">
      <div className="section-divider section-divider-top" />
      <div className="community-canvas">
        {CanvasComponent && <CanvasComponent />}
      </div>
      <div className="section-divider section-divider-bottom" />
    </section>
  );
}
