import {Link} from 'react-router';
import {useRef, useState} from 'react';

export function RecommendedProducts() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Hardcoded products for now
  const products = [
    {
      id: '1',
      title: 'Logo Socks',
      subtitle: 'Black',
      price: '€30',
      handle: 'logo-socks-black'
    },
    {
      id: '2', 
      title: 'Logo Socks',
      subtitle: 'White',
      price: '€30',
      handle: 'logo-socks-white'
    },
    {
      id: '3',
      title: 'Sounds Good Spray Socks',
      subtitle: 'White',
      price: '€30',
      handle: 'sounds-good-spray-socks'
    },
    {
      id: '4',
      title: 'Listening Cap',
      subtitle: 'Black',
      price: '€60',
      handle: 'listening-cap-black'
    },
    {
      id: '5',
      title: 'Avenue Sneaker',
      subtitle: 'Black/White',
      price: '€100',
      handle: 'avenue-sneaker-black'
    },
    {
      id: '6',
      title: 'Logo T-Shirt',
      subtitle: 'White',
      price: '€45',
      handle: 'logo-tshirt-white'
    },
    {
      id: '7',
      title: 'Logo Hoodie',
      subtitle: 'Black',
      price: '€120',
      handle: 'logo-hoodie-black'
    },
    {
      id: '8',
      title: 'Canvas Tote',
      subtitle: 'Natural',
      price: '€35',
      handle: 'canvas-tote-natural'
    },
    {
      id: '9',
      title: 'Spray Bottle',
      subtitle: 'Clear',
      price: '€15',
      handle: 'spray-bottle-clear'
    }
  ];

  return (
    <div className="recommended-products">
      <h2 className="recommended-title">
        Recommended For You
      </h2>
      <div 
        className={`recommended-grid ${isDragging ? 'dragging' : ''}`}
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {products.map((product) => (
          <div key={product.id} className="recommended-product-card">
            <Link
              to={`/products/${product.handle}`}
              className="recommended-product-link"
            >
              <div className="recommended-product-image">
                <div className="placeholder-image" style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  {product.title}
                </div>
              </div>
              <div className="recommended-product-info">
                <h3 className="recommended-product-title">{product.title}</h3>
                <p className="recommended-product-subtitle">{product.subtitle}</p>
                <p className="recommended-product-price">{product.price}</p>
              </div>
            </Link>
            <div className="recommended-product-colors">
              {product.id === '1' && (
                <>
                  <span className="color-swatch color-black active"></span>
                  <span className="color-swatch color-white"></span>
                </>
              )}
              {product.id === '2' && (
                <>
                  <span className="color-swatch color-white active"></span>
                  <span className="color-swatch color-black"></span>
                </>
              )}
              {product.id === '3' && (
                <>
                  <span className="color-swatch color-white active"></span>
                  <span className="color-swatch color-pink"></span>
                </>
              )}
              {product.id === '4' && (
                <>
                  <span className="color-swatch color-black active"></span>
                  <span className="color-swatch color-blue"></span>
                </>
              )}
              {product.id === '5' && (
                <>
                  <span className="color-swatch color-black active"></span>
                  <span className="color-swatch color-white"></span>
                </>
              )}
              {product.id === '6' && (
                <>
                  <span className="color-swatch color-white active"></span>
                  <span className="color-swatch color-black"></span>
                </>
              )}
              {product.id === '7' && (
                <>
                  <span className="color-swatch color-black active"></span>
                </>
              )}
              {product.id === '8' && (
                <>
                  <span className="color-swatch color-white active"></span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}