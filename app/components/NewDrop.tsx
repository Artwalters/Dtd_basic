import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
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
      title: 'Fragment Tee',
      price: '65€',
      image: '/Img/DSC04304.webp',
      handle: 'fragment-tee',
    },
  },
  {
    id: 'pants-1',
    x: 72,
    y: 68,
    product: {
      title: 'Genesis Pants',
      price: '95€',
      image: '/Img/DSC04329.webp',
      handle: 'genesis-pants',
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
  onToggle,
}: {
  marker: ProductMarker;
  isActive: boolean;
  onToggle: () => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={markerRef}
      className={`product-marker ${isActive ? 'active' : ''}`}
      style={{left: `${marker.x}%`, top: `${marker.y}%`}}
    >
      <button
        type="button"
        className="product-marker-pin"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        aria-label={`View ${marker.product.title}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line className="marker-line-h" x1="6" y1="12" x2="18" y2="12" />
          <line className="marker-line-v" x1="12" y1="6" x2="12" y2="18" />
        </svg>
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
          Shop all
        </Link>
        <span className="new-drop-item-count">{gridProducts.length} Items</span>
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
                  onToggle={() =>
                    setActiveMarkerId(activeMarkerId === marker.id ? null : marker.id)
                  }
                />
              ))}
            </div>

            <Link to="/collections/all" className="btn btn-glass new-drop-featured-btn">
              VIEW PRODUCTS
            </Link>
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
