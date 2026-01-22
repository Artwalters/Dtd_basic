import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';

interface HeroSlide {
  id: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  subtitle: string;
  title: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [SwiperComponents, setSwiperComponents] = useState<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Load Swiper only on client
  useEffect(() => {
    setIsClient(true);
    import('swiper/react').then((mod) => {
      import('swiper/css').then(() => {
        setSwiperComponents({
          Swiper: mod.Swiper,
          SwiperSlide: mod.SwiperSlide
        });
      });
    });
  }, []);

  useEffect(() => {
    if (progressRef.current && slides.length > 1) {
      const progress = currentSlide / (slides.length - 1);
      progressRef.current.style.transform = `translateX(${progress * 100 * 2}%)`;
    }
  }, [currentSlide, slides.length]);

  if (slides.length === 0) return null;

  // Render slide media (video or image)
  const renderSlideMedia = (slide: HeroSlide) => {
    if (slide.backgroundVideo) {
      return (
        <video
          src={slide.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          className="hero-slide-video"
        />
      );
    }
    return (
      <img
        src={slide.backgroundImage}
        alt=""
        draggable={false}
        className="hero-slide-image"
      />
    );
  };

  // Show first slide while Swiper loads
  const renderSlider = () => {
    if (!isClient || !SwiperComponents) {
      return (
        <div className="hero-slide">
          {renderSlideMedia(slides[0])}
        </div>
      );
    }

    const { Swiper, SwiperSlide } = SwiperComponents;

    return (
      <Swiper
        speed={600}
        spaceBetween={0}
        slidesPerView={1}
        threshold={2}
        touchRatio={1}
        resistanceRatio={0.5}
        longSwipesRatio={0.1}
        longSwipesMs={100}
        shortSwipes={true}
        followFinger={true}
        loop={true}
        touchEventsTarget="container"
        onSlideChange={(s: any) => setCurrentSlide(s.realIndex)}
        onTouchStart={() => {
          window.dispatchEvent(new CustomEvent('swiper-drag-start'));
        }}
        onTouchEnd={() => {
          window.dispatchEvent(new CustomEvent('swiper-drag-end'));
        }}
        onProgress={(s: any) => {
          if (progressRef.current && slides.length > 1) {
            const progress = s.realIndex / (slides.length - 1);
            progressRef.current.style.transform = `translateX(${progress * 100 * 2}%)`;
          }
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} style={{ width: '100%', height: '100%' }}>
            <div className="hero-slide">
              {renderSlideMedia(slide)}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <section
      aria-label="Hero Slider"
      role="region"
      aria-roledescription="carousel"
      className="hero-slider"
      data-cursor="click & drag"
    >
      {renderSlider()}
      <div className="hero-slide-gradient" />

      <div className="hero-bottom">
        <div className="hero-content-row">
          <div className="hero-slide-text">
            <span className="hero-slide-subtitle">{slides[currentSlide]?.subtitle}</span>
            <h1 className="hero-slide-title">{slides[currentSlide]?.title}</h1>
          </div>
          <Link to={slides[currentSlide]?.buttonLink || '/collections/all'} className="btn btn-solid">
            {slides[currentSlide]?.buttonText || 'Shop now'}
          </Link>
        </div>
        <div className="hero-slider-progress">
          <div className="progress-track">
            <div
              ref={progressRef}
              className="progress-fill hero-slider-progress-fill"
              style={{ width: `${100 / slides.length}%`, transition: 'transform 0.6s ease-out' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
