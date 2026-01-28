import {useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router';
import {gsap} from 'gsap';

import type {CollectionItemFragment} from 'storefrontapi.generated';

// Product marker position config (only positions, products fetched from Shopify)
interface MarkerPosition {
  id: string;
  handle: string;  // Shopify product handle to look up
  x: number;  // percentage position (0-100)
  y: number;  // percentage position (0-100)
}

const TOTAL_FRAMES = 90;
const FRAME_DURATION = 25;

// Marker positions - products will be looked up by handle
const DEFAULT_MARKER_POSITIONS: MarkerPosition[] = [
  {
    id: 'shirt-1',
    handle: 'envision-oversized-tee',
    x: 28,
    y: 38,
  },
  {
    id: 'pants-1',
    handle: 'resist-sweats',
    x: 72,
    y: 68,
  },
];

interface ShopTheLookProps {
  products: CollectionItemFragment[];
  featuredImage?: string;
  featuredImage2?: string;
  markerPositions?: MarkerPosition[];
  markerPositions2?: MarkerPosition[];
}

// Product marker pin with popup - uses real Shopify product data
function ProductMarkerPin({
  position,
  product,
  isActive,
  onActivate,
  onDeactivate,
}: {
  position: MarkerPosition;
  product: CollectionItemFragment;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  const pulseTimeline = useRef<gsap.core.Timeline | null>(null);

  // 360° rotation state
  const [currentFrame, setCurrentFrame] = useState(1);
  const animationRef = useRef<number | null>(null);
  const sequenceBaseUrl = (product as any).productVideo360?.value as string | undefined;

  // Helper to get frame URL
  const getFrameUrl = useCallback((frameNum: number) => {
    if (!sequenceBaseUrl) return '';
    const paddedFrame = String(frameNum).padStart(4, '0');
    return `${sequenceBaseUrl}${paddedFrame}.webp`;
  }, [sequenceBaseUrl]);

  // Continuous rotation animation when popup is active
  useEffect(() => {
    if (!isActive || !sequenceBaseUrl) return;

    let frame = 1;
    const animate = () => {
      frame--;
      if (frame < 1) frame = TOTAL_FRAMES;
      setCurrentFrame(frame);
      animationRef.current = window.setTimeout(animate, FRAME_DURATION);
    };

    animationRef.current = window.setTimeout(animate, FRAME_DURATION);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isActive, sequenceBaseUrl]);

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

  // Format price from Shopify Money
  const formatPrice = (price: {amount: string; currencyCode: string}) => {
    const amount = parseFloat(price.amount);
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: price.currencyCode,
    }).format(amount);
  };

  return (
    <div
      ref={markerRef}
      className={`product-marker ${isActive ? 'active' : ''}`}
      style={{left: `${position.x}%`, top: `${position.y}%`}}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <button
        type="button"
        className="product-marker-pin"
        aria-label={`View ${product.title}`}
        data-cursor-hide
      >
        <span ref={pulseRef} className="marker-pulse-ring" />
        <span className={`marker-plus-icon ${isActive ? 'marker-plus-rotated' : ''}`} />
      </button>

      {isActive && (
        <Link
          to={`/products/${product.handle}`}
          className={`product-marker-popup ${sequenceBaseUrl ? 'product-marker-popup--with-image' : ''}`}
          onClick={(e) => e.stopPropagation()}
          data-cursor-hide
        >
          {sequenceBaseUrl && (
            <div className="product-marker-popup-image">
              <img
                src={getFrameUrl(currentFrame)}
                alt={product.title}
                className="product-marker-popup-image-360"
              />
            </div>
          )}
          <div className="product-marker-popup-content">
            <div className="product-marker-popup-title">{product.title}</div>
            <div className="product-marker-popup-price">{formatPrice(product.priceRange.minVariantPrice)}</div>
          </div>
        </Link>
      )}
    </div>
  );
}

export function ShopTheLook({
  products,
  featuredImage = '/Img/new-drop-featured.jpg',
  featuredImage2 = '/Img/DSC06729.webp',
  markerPositions = DEFAULT_MARKER_POSITIONS,
  markerPositions2 = [],
}: ShopTheLookProps) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  // Look up products by handle for markers
  const getProductByHandle = (handle: string) =>
    products.find(p => p.handle === handle);

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

  return (
    <section className="shop-the-look">
      <div className="shop-the-look-grid">
        <div className="shop-the-look-featured" ref={featuredRef} data-cursor="explore">
          <div className="shop-the-look-featured-wrapper">
            <img src={featuredImage} alt="" className="shop-the-look-featured-image" />

            {/* Product markers overlay */}
            <div className="product-markers-overlay">
              {markerPositions.map((position) => {
                const product = getProductByHandle(position.handle);
                if (!product) return null;
                return (
                  <ProductMarkerPin
                    key={position.id}
                    position={position}
                    product={product}
                    isActive={activeMarkerId === position.id}
                    onActivate={() => setActiveMarkerId(position.id)}
                    onDeactivate={() => setActiveMarkerId(null)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="shop-the-look-featured" data-cursor="explore">
          <div className="shop-the-look-featured-wrapper">
            <img src={featuredImage2} alt="" className="shop-the-look-featured-image" />

            {/* Product markers overlay */}
            <div className="product-markers-overlay">
              {markerPositions2.map((position) => {
                const product = getProductByHandle(position.handle);
                if (!product) return null;
                return (
                  <ProductMarkerPin
                    key={position.id}
                    position={position}
                    product={product}
                    isActive={activeMarkerId === position.id}
                    onActivate={() => setActiveMarkerId(position.id)}
                    onDeactivate={() => setActiveMarkerId(null)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
