import {useState, useEffect, type ComponentType} from 'react';

export function CommunitySection() {
  const [CanvasComponent, setCanvasComponent] = useState<ComponentType | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Dynamic import only on client side
    import('./CommunityCanvas').then((mod) => {
      setCanvasComponent(() => mod.default);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Email submitted:', email);
  };

  return (
    <section className="community-section">
      <div className="community-canvas">
        {CanvasComponent && <CanvasComponent />}
      </div>
      <div className="community-content">
        <div className="community-top">
          <p className="community-subtitle">JOIN THE COMMUNITY</p>
          <h2 className="community-title">LET'S CONNECT</h2>
        </div>
        <form className="community-form" onSubmit={handleSubmit}>
          <div className="community-form-wrapper">
            <input
              type="email"
              placeholder="Email*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="community-email-input"
              required
            />
            <button type="submit" className="community-submit-btn">
              SUBMIT
            </button>
          </div>
          <p className="community-privacy">We respect your privacy. Unsubscribe anytime.</p>
        </form>
      </div>
    </section>
  );
}
