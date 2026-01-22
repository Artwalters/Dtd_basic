import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {getLenis} from '~/hooks/useLenis';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Measurements {
  height: string;
  weight: string;
  chest: string;
  build: 'lean' | 'athletic' | 'muscular' | 'heavyweight';
  fit: 'fitted' | 'regular' | 'oversized';
}

const sizeChart = {
  S: {chest: [94, 100], weight: [65, 75], description: 'Fitted for lean athletic builds'},
  M: {chest: [100, 106], weight: [75, 85], description: 'Ideal for athletic to muscular builds'},
  L: {chest: [106, 112], weight: [85, 95], description: 'Room for developed upper body'},
  XL: {chest: [112, 120], weight: [95, 110], description: 'Built for serious muscle mass'},
  XXL: {chest: [120, 130], weight: [110, 130], description: 'Maximum room for heavyweight builds'},
};

const buildMultiplier = {
  lean: 0.9,
  athletic: 1.0,
  muscular: 1.1,
  heavyweight: 1.2,
};

export function SizeGuide({isOpen, onClose}: SizeGuideProps) {
  const [step, setStep] = useState<'intro' | 'form' | 'result'>('intro');
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [measurements, setMeasurements] = useState<Measurements>({
    height: '',
    weight: '',
    chest: '',
    build: 'athletic',
    fit: 'regular',
  });
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  // Wait for client-side mount for portal
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const lenis = getLenis();
    lenis?.stop();

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen, isMobile]);

  const calculateSize = () => {
    const weight = parseFloat(measurements.weight);
    const chest = parseFloat(measurements.chest);
    const multiplier = buildMultiplier[measurements.build];

    // Adjust weight based on build type
    const adjustedWeight = weight * multiplier;

    // Size order for adjustments
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

    // Determine base size based on measurements
    let sizeIndex = 1; // Default to M

    if (chest) {
      // Prioritize chest measurement for bodybuilders
      if (chest >= 120) sizeIndex = 4;
      else if (chest >= 112) sizeIndex = 3;
      else if (chest >= 106) sizeIndex = 2;
      else if (chest >= 100) sizeIndex = 1;
      else sizeIndex = 0;
    } else if (adjustedWeight) {
      // Fallback to weight-based recommendation
      if (adjustedWeight >= 110) sizeIndex = 4;
      else if (adjustedWeight >= 95) sizeIndex = 3;
      else if (adjustedWeight >= 85) sizeIndex = 2;
      else if (adjustedWeight >= 75) sizeIndex = 1;
      else sizeIndex = 0;
    }

    // Adjust for fit preference
    if (measurements.fit === 'fitted') {
      sizeIndex = Math.max(0, sizeIndex - 1);
    } else if (measurements.fit === 'oversized') {
      sizeIndex = Math.min(sizes.length - 1, sizeIndex + 1);
    }

    setRecommendedSize(sizes[sizeIndex]);
    setStep('result');
  };

  const resetGuide = () => {
    setStep('intro');
    setMeasurements({height: '', weight: '', chest: '', build: 'athletic', fit: 'regular'});
    setRecommendedSize(null);
  };

  // Don't render on server for mobile portal
  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderContent = () => (
    <>
      {step === 'intro' && (
          <div className="size-guide-content">
            <div className="size-guide-header">
              <h2 className="size-guide-title">Find Your Fit</h2>
            </div>
            <div className="size-guide-divider-bracket" />
            <div className="size-guide-scrollable">
              <p className="size-guide-subtitle">
                Built for athletes who push limits. Our sizing is designed with serious lifters in mind.
              </p>

              <div className="size-guide-options">
                <button className="size-guide-option-btn" onClick={() => setStep('form')}>
                  <span className="option-text">Find My Size</span>
                </button>

                <div className="size-guide-or">
                  <span>or view size chart</span>
                </div>

                <div className="size-chart-preview">
                  <table className="size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Chest</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sizeChart).map(([size, data]) => (
                        <tr key={size}>
                          <td>{size}</td>
                          <td>{data.chest[0]}-{data.chest[1]}cm</td>
                          <td>{data.weight[0]}-{data.weight[1]}kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
                      </div>
        )}

        {step === 'form' && (
          <div className="size-guide-content">
            <div className="size-guide-header size-guide-header--row">
              <button className="size-guide-back" onClick={() => setStep('intro')}>
                Back
              </button>
              <h2 className="size-guide-title">Measurements</h2>
              <button className="size-guide-header-close" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="size-guide-divider-bracket" />
            <div className="size-guide-scrollable">
              <p className="size-guide-subtitle">
                Enter your stats for a personalized recommendation
              </p>

              <div className="size-form">
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 180"
                    value={measurements.height}
                    onChange={(e) => setMeasurements({...measurements, height: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90"
                    value={measurements.weight}
                    onChange={(e) => setMeasurements({...measurements, weight: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Chest circumference (cm) <span className="optional">optional</span></label>
                  <input
                    type="number"
                    placeholder="e.g. 110"
                    value={measurements.chest}
                    onChange={(e) => setMeasurements({...measurements, chest: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Body Type</label>
                  <div className="build-options">
                    {(['lean', 'athletic', 'muscular', 'heavyweight'] as const).map((build) => (
                      <button
                        key={build}
                        className={`build-option ${measurements.build === build ? 'active' : ''}`}
                        onClick={() => setMeasurements({...measurements, build})}
                      >
                        {build.charAt(0).toUpperCase() + build.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Preferred Fit</label>
                  <div className="fit-options">
                    {(['fitted', 'regular', 'oversized'] as const).map((fit) => (
                      <button
                        key={fit}
                        className={`fit-option ${measurements.fit === fit ? 'active' : ''}`}
                        onClick={() => setMeasurements({...measurements, fit})}
                      >
                        {fit.charAt(0).toUpperCase() + fit.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="size-guide-submit"
                  onClick={calculateSize}
                  disabled={!measurements.weight && !measurements.chest}
                >
                  Find My Size
                </button>
              </div>
            </div>
                      </div>
        )}

        {step === 'result' && recommendedSize && (
          <div className="size-guide-content">
            <div className="size-guide-header size-guide-header--row">
              <button className="size-guide-back" onClick={resetGuide}>
                Back
              </button>
              <h2 className="size-guide-title">Your Size</h2>
              <button className="size-guide-header-close" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="size-guide-divider-bracket" />
            <div className="size-guide-scrollable">
              <div className="size-result">
                <div className="recommended-size">
                  <span className="size-badge">{recommendedSize}</span>
                  <p className="size-description">
                    {sizeChart[recommendedSize as keyof typeof sizeChart]?.description}
                  </p>
                  <p className="fit-preference-badge">
                    {measurements.fit === 'fitted' && 'Fitted look'}
                    {measurements.fit === 'regular' && 'Regular fit'}
                    {measurements.fit === 'oversized' && 'Oversized style'}
                  </p>
                </div>

                <div className="size-tips">
                  <h3>Fit Tips</h3>
                  <ul>
                    <li>Our tees are designed with dropped shoulders for unrestricted movement</li>
                    {measurements.fit === 'fitted' && (
                      <li>Fitted selection: This will hug your physique and show definition</li>
                    )}
                    {measurements.fit === 'regular' && (
                      <li>Regular fit: Comfortable all-day wear with room to move</li>
                    )}
                    {measurements.fit === 'oversized' && (
                      <li>Oversized selection: Extra room for that relaxed streetwear look</li>
                    )}
                    <li>Stretchy premium cotton adapts to your pump</li>
                    {measurements.build === 'heavyweight' && (
                      <li>For mass monsters: extra room in shoulders included</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
                      </div>
        )}
    </>
  );

  // Mobile: render as bottom sheet via portal
  if (isMobile) {
    return createPortal(
      <div
        className={`size-guide-mobile-backdrop ${isOpen ? 'size-guide-mobile-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      >
        <div className={`size-guide-mobile ${isOpen ? 'size-guide-mobile--open' : ''}`}>
          <div className={`size-guide-mobile__header ${step === 'intro' ? 'size-guide-mobile__header--intro' : ''}`}>
            {step !== 'intro' && (
              <button
                className="size-guide-mobile__back"
                onClick={() => step === 'result' ? resetGuide() : setStep('intro')}
              >
                BACK
              </button>
            )}
            <h2 className="size-guide-mobile__title">Size Guide</h2>
            <button
              className="size-guide-mobile__close"
              onClick={onClose}
              aria-label="Close"
            >
              CLOSE
            </button>
          </div>
          <div className="size-guide-mobile__content">
            {renderContent()}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Desktop: render as modal
  if (!isOpen) return null;

  return (
    <div className="size-guide-overlay" onClick={onClose}>
      <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
}
