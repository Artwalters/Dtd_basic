import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import {gsap} from 'gsap';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ProductCard} from './ProductCard';

// Product marker types for "shop the look" feature
interface ProductMarker {
  id: string;
  x: number;  // percentage position (0-100)
  y: number;  // percentage position (0-100)
  product: {
    title: string;
    price: string;
    image: string;
    handle: string;
  };
}

// Mockup marker data
const DEFAULT_MARKERS: ProductMarker[] = [
  {
    id: 'shirt-1',
    x: 28,
    y: 38,
    product: {
      title: 'Envision Oversized Tee',
      price: '40€',
      image: '/Img/DSC04304.webp',
      handle: 'envision-oversized-tee',
    },
  },
  {
    id: 'pants-1',
    x: 72,
    y: 68,
    product: {
      title: 'Resist Sweats',
      price: '95€',
      image: '/Img/DSC04329.webp',
      handle: 'resist-sweats',
    },
  },
];

interface NewDropProps {
  products: CollectionItemFragment[];
  title?: string;
  featuredImage?: string;
  productMarkers?: ProductMarker[];
}

// Product marker pin with popup
function ProductMarkerPin({
  marker,
  isActive,
  onActivate,
  onDeactivate,
}: {
  marker: ProductMarker;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  const pulseTimeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!pulseRef.current) return;

    // Create pulse animation timeline
    pulseTimeline.current = gsap.timeline({repeat: -1, yoyo: true})
      .to(pulseRef.current, {
        scale: 1.5,
        duration: 1,
        ease: 'sine.inOut',
      });

    return () => {
      pulseTimeline.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (!pulseRef.current || !pulseTimeline.current) return;

    if (isActive) {
      // Smoothly animate to scale 1 when hovering
      pulseTimeline.current.pause();
      gsap.to(pulseRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      // Resume pulse animation
      gsap.to(pulseRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          pulseTimeline.current?.restart();
        },
      });
    }
  }, [isActive]);

  return (
    <div
      ref={markerRef}
      className={`product-marker ${isActive ? 'active' : ''}`}
      style={{left: `${marker.x}%`, top: `${marker.y}%`}}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <button
        type="button"
        className="product-marker-pin"
        aria-label={`View ${marker.product.title}`}
      >
        <span ref={pulseRef} className="marker-pulse-ring" />
        <span className={`marker-plus-icon ${isActive ? 'marker-plus-rotated' : ''}`} />
      </button>

      {isActive && (
        <Link
          to={`/products/${marker.product.handle}`}
          className="product-marker-popup"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="product-marker-popup-title">{marker.product.title}</div>
          <div className="product-marker-popup-price">{marker.product.price}</div>
          <div className="product-marker-popup-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeMiterlimit="10">
              <path d="M15 10L20 15L15 20" />
              <path d="M4 4V12L7 15H20" />
            </svg>
          </div>
        </Link>
      )}
    </div>
  );
}

export function NewDrop({
  products,
  title = 'New Drop',
  featuredImage = '/hero-bg.jpg',
  productMarkers = DEFAULT_MARKERS,
}: NewDropProps) {
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  // Listen for closeQuickAdd event from header nav clicks
  useEffect(() => {
    const handleCloseQuickAdd = () => {
      setOpenProductId(null);
    };
    window.addEventListener('closeQuickAdd', handleCloseQuickAdd);
    return () => window.removeEventListener('closeQuickAdd', handleCloseQuickAdd);
  }, []);

  // Close popup when clicking outside (with delay to prevent immediate close)
  useEffect(() => {
    if (!activeMarkerId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-marker')) {
        setActiveMarkerId(null);
      }
    };

    // Small delay to prevent the same click from closing the popup
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMarkerId]);

  // Take first 6 products for the grid
  const gridProducts = products.slice(0, 6);

  const handleToggle = (productId: string) => {
    setOpenProductId(openProductId === productId ? null : productId);
  };

  return (
    <section className="new-drop">
      <div className="section-divider" />
      <div className="new-drop-section-header">
        <h2 className="new-drop-section-title">{title}</h2>
        <Link to="/collections/all" className="btn btn-glass new-drop-shop-all">
          View all
        </Link>
      </div>

      <div className="new-drop-grid">
        <div className="new-drop-featured" ref={featuredRef}>
          <div className="new-drop-featured-wrapper">
            <img src={featuredImage} alt="" className="new-drop-featured-image" />

            {/* Product markers overlay */}
            <div className="product-markers-overlay">
              {productMarkers.map((marker) => (
                <ProductMarkerPin
                  key={marker.id}
                  marker={marker}
                  isActive={activeMarkerId === marker.id}
                  onActivate={() => setActiveMarkerId(marker.id)}
                  onDeactivate={() => setActiveMarkerId(null)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="new-drop-products-wrapper">
          <div className="new-drop-products">
            {gridProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="new-drop-footer">
        <Link to="/collections/all" className="btn btn-solid">
          Shop now
        </Link>
      </div>
    </section>
  );
}
