import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ProductCard} from './ProductCard';

interface NewArrivalsProps {
  products: CollectionItemFragment[];
  title?: string;
}

export function NewArrivals({
  products,
  title = 'New Arrivals',
}: NewArrivalsProps) {
  const [isClient, setIsClient] = useState(false);
  const [SwiperComponents, setSwiperComponents] = useState<any>(null);
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleToggle = (productId: string) => {
    setOpenProductId(openProductId === productId ? null : productId);
  };

  // Load Swiper only on client
  useEffect(() => {
    setIsClient(true);
    Promise.all([
      import('swiper/react'),
      import('swiper/modules'),
      import('swiper/css')
    ]).then(([swiperReact, swiperModules]) => {
      setSwiperComponents({
        Swiper: swiperReact.Swiper,
        SwiperSlide: swiperReact.SwiperSlide,
        FreeMode: swiperModules.FreeMode
      });
    });
  }, []);

  const renderSlider = () => {
    if (!isClient || !SwiperComponents) {
      // SSR fallback - show products in a simple grid
      return (
        <div className="new-arrivals-track">
          {products.map((product) => (
            <div key={product.id} className="new-arrivals-slide">
              <ProductCard
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            </div>
          ))}
        </div>
      );
    }

    const { Swiper, SwiperSlide, FreeMode } = SwiperComponents;

    return (
      <Swiper
        modules={[FreeMode]}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          768: {
            slidesPerView: 3,
            spaceBetween: 16
          },
          992: {
            slidesPerView: 4,
            spaceBetween: 16
          }
        }}
        freeMode={{
          enabled: true,
          sticky: true,
          momentumRatio: 0.8,
          momentumVelocityRatio: 0.6,
          momentumBounceRatio: 0.5
        }}
        threshold={15}
        touchRatio={0.6}
        speed={400}
        onProgress={(s: any, progress: number) => {
          if (progressRef.current) {
            const clampedProgress = Math.max(0, Math.min(1, progress));
            progressRef.current.style.transform = `translateX(${clampedProgress * 100 * 2}%)`;
          }
        }}
        className="new-arrivals-swiper"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <div className="new-arrivals-slide">
              <ProductCard
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <section
      aria-label="New Arrivals"
      role="region"
      className="new-arrivals"
    >
      <div className="section-divider" />
      <div className="new-arrivals-header">
        <h2 className="new-arrivals-title">{title}</h2>
        <div className="new-arrivals-progress">
          <div className="progress-track">
            <div
              ref={progressRef}
              className="progress-fill new-arrivals-progress-fill"
              style={{ transition: 'transform 0.1s ease-out' }}
            />
          </div>
        </div>
        <Link to="/collections/all" className="btn btn-glass new-arrivals-shop-all">
          SHOP ALL
        </Link>
      </div>
      <div className="new-arrivals-collection">
        {renderSlider()}
      </div>
    </section>
  );
}
