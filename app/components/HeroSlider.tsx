import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import gsap from 'gsap';
import {Observer} from 'gsap/all';

// Register Observer plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Observer);
}

interface HeroSlide {
  id: string;
  backgroundImage: string;
  subtitle: string;
  title: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const sliderRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderInstanceRef = useRef<{ destroy: () => void } | null>(null);

  const updateCurrentSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !sliderRef.current || slides.length === 0) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (sliderRef.current) {
        sliderInstanceRef.current = initHeroSlider(sliderRef.current, updateCurrentSlide);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (sliderInstanceRef.current) {
        sliderInstanceRef.current.destroy();
      }
    };
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section
      ref={sliderRef}
      data-hero-slideshow="wrap"
      aria-label="Hero Slider"
      role="region"
      aria-roledescription="carousel"
      className="hero-slider"
    >
      <div className="hero-slider-list">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            data-hero-slideshow="slide"
            className={`hero-slide ${index === 0 ? 'is--current' : ''}`}
          >
            <img
              data-hero-slideshow="parallax"
              src={slide.backgroundImage}
              alt=""
              draggable="false"
              className="hero-slide-image"
            />
            <div className="hero-slide-gradient" />
          </div>
        ))}
      </div>

      <div className="hero-bottom">
        <div className="hero-content-row">
          <div className="hero-slide-text">
            <span className="hero-slide-subtitle">{slides[currentSlide]?.subtitle}</span>
            <h1 className="hero-slide-title">{slides[currentSlide]?.title}</h1>
          </div>
          <Link to={slides[currentSlide]?.buttonLink || '/collections/all'} className="btn btn-glass">
            {slides[currentSlide]?.buttonText || 'SHOP NOW'}
          </Link>
        </div>
        <div className="hero-slider-progress">
          <div className="progress-track">
            <div
              className="progress-fill hero-slider-progress-fill"
              style={{ width: `${100 / slides.length}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// GSAP Hero Slider Initialization Function with Wipe/Parallax effect
function initHeroSlider(
  root: HTMLElement,
  onSlideChange?: (index: number) => void
): { destroy: () => void } {
  const slides = Array.from(root.querySelectorAll('[data-hero-slideshow="slide"]')) as HTMLElement[];
  const inner = Array.from(root.querySelectorAll('[data-hero-slideshow="parallax"]')) as HTMLElement[];
  const progressFill = root.querySelector('.hero-slider-progress-fill') as HTMLElement;

  let current = 0;
  const length = slides.length;
  let animating = false;
  let observer: any = null;
  const animationDuration = 0.9;

  // Set initial state
  slides[current].classList.add('is--current');

  function updateProgress() {
    if (progressFill && length > 1) {
      const progress = current / (length - 1);
      const percentage = progress * 100;
      progressFill.style.transform = `translateX(${percentage * 2}%)`;
    }
  }

  function navigate(direction: number, targetIndex: number | null = null) {
    if (animating) return;
    animating = true;
    if (observer) observer.disable();

    const previous = current;
    current =
      targetIndex !== null && targetIndex !== undefined
        ? targetIndex
        : direction === 1
          ? current < length - 1
            ? current + 1
            : 0
          : current > 0
            ? current - 1
            : length - 1;

    const currentSlide = slides[previous];
    const currentInner = inner[previous];
    const upcomingSlide = slides[current];
    const upcomingInner = inner[current];

    gsap.timeline({
      defaults: {
        duration: animationDuration,
        ease: 'power3.out'
      },
      onStart: function () {
        upcomingSlide.classList.add('is--current');
        if (onSlideChange) {
          onSlideChange(current);
        }
        updateProgress();
      },
      onComplete: function () {
        currentSlide.classList.remove('is--current');
        gsap.set(currentSlide, { xPercent: 0 });
        gsap.set(currentInner, { xPercent: 0 });
        animating = false;
        setTimeout(() => {
          if (observer) observer.enable();
        }, animationDuration * 100);
      }
    })
      .to(currentSlide, { xPercent: -direction * 100 }, 0)
      .to(currentInner, { xPercent: direction * 50 }, 0)
      .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
  }

  // Create Observer for swipe/drag
  observer = Observer.create({
    target: root,
    type: 'touch,pointer',
    onLeft: () => {
      if (!animating) navigate(1);
    },
    onRight: () => {
      if (!animating) navigate(-1);
    },
    tolerance: 30,
    dragMinimum: 3,
    preventDefault: false,
    allowClicks: true
  });

  // Initial progress update
  updateProgress();

  // Return cleanup function
  return {
    destroy: function () {
      if (observer) observer.kill();
    }
  };
}