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

// GSAP Hero Slider Initialization Function with Magnetic Swipe effect
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

  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let dragDelta = 0;
  const snapThreshold = 0.35; // 35% of width to trigger slide change

  // Set initial state
  slides[current].classList.add('is--current');

  function updateProgress() {
    if (progressFill && length > 1) {
      const progress = current / (length - 1);
      const percentage = progress * 100;
      progressFill.style.transform = `translateX(${percentage * 2}%)`;
    }
  }

  function getNextIndex(direction: number): number {
    if (direction === 1) {
      return current < length - 1 ? current + 1 : 0;
    } else {
      return current > 0 ? current - 1 : length - 1;
    }
  }

  function updateDragPosition(delta: number) {
    const width = root.offsetWidth;
    const percent = (delta / width) * 100;
    const direction = delta < 0 ? 1 : -1;
    const nextIndex = getNextIndex(direction);

    const currentSlide = slides[current];
    const currentInner = inner[current];
    const nextSlide = slides[nextIndex];
    const nextInner = inner[nextIndex];

    // Move current slide with drag
    gsap.set(currentSlide, { xPercent: percent });
    gsap.set(currentInner, { xPercent: -percent * 0.5 });

    // Position next slide
    nextSlide.classList.add('is--current');
    gsap.set(nextSlide, { xPercent: direction * 100 + percent });
    gsap.set(nextInner, { xPercent: -direction * 50 - percent * 0.5 });

    // Update progress indicator during drag
    if (progressFill && length > 1) {
      const dragProgress = Math.abs(delta) / width;
      const currentProgress = current / (length - 1);
      const nextProgress = nextIndex / (length - 1);
      const interpolatedProgress = currentProgress + (nextProgress - currentProgress) * dragProgress;
      progressFill.style.transform = `translateX(${interpolatedProgress * 100 * 2}%)`;
    }
  }

  function snapToSlide(shouldNavigate: boolean, direction: number) {
    animating = true;
    if (observer) observer.disable();

    const animationDuration = 0.5;
    const ease = 'power3.out';

    if (shouldNavigate) {
      const previous = current;
      current = getNextIndex(direction);

      const prevSlide = slides[previous];
      const prevInner = inner[previous];
      const currentSlide = slides[current];
      const currentInner = inner[current];

      gsap.timeline({
        defaults: { duration: animationDuration, ease },
        onStart: () => {
          if (onSlideChange) onSlideChange(current);
          updateProgress();
        },
        onComplete: () => {
          prevSlide.classList.remove('is--current');
          gsap.set(prevSlide, { xPercent: 0 });
          gsap.set(prevInner, { xPercent: 0 });
          animating = false;
          if (observer) observer.enable();
        }
      })
        .to(prevSlide, { xPercent: -direction * 100 }, 0)
        .to(prevInner, { xPercent: direction * 50 }, 0)
        .to(currentSlide, { xPercent: 0 }, 0)
        .to(currentInner, { xPercent: 0 }, 0);
    } else {
      // Snap back to current slide
      const nextIndex = getNextIndex(direction);
      const currentSlide = slides[current];
      const currentInner = inner[current];
      const nextSlide = slides[nextIndex];
      const nextInner = inner[nextIndex];

      gsap.timeline({
        defaults: { duration: animationDuration, ease },
        onComplete: () => {
          nextSlide.classList.remove('is--current');
          gsap.set(nextSlide, { xPercent: direction * 100 });
          gsap.set(nextInner, { xPercent: -direction * 50 });
          animating = false;
          if (observer) observer.enable();
        }
      })
        .to(currentSlide, { xPercent: 0 }, 0)
        .to(currentInner, { xPercent: 0 }, 0)
        .to(nextSlide, { xPercent: direction * 100 }, 0)
        .to(nextInner, { xPercent: -direction * 50 }, 0);
    }
  }

  // Create Observer for magnetic swipe/drag
  observer = Observer.create({
    target: root,
    type: 'touch,pointer',
    onPress: (self) => {
      if (animating) return;
      isDragging = true;
      dragStartX = self.x;
      dragDelta = 0;
    },
    onDrag: (self) => {
      if (!isDragging || animating) return;
      dragDelta = self.x - dragStartX;
      updateDragPosition(dragDelta);
    },
    onRelease: () => {
      if (!isDragging || animating) return;
      isDragging = false;

      const width = root.offsetWidth;
      const percent = Math.abs(dragDelta) / width;
      const direction = dragDelta < 0 ? 1 : -1;

      // Only navigate if we've passed the threshold
      const shouldNavigate = percent > snapThreshold;

      snapToSlide(shouldNavigate, direction);
      dragDelta = 0;
    },
    tolerance: 0,
    dragMinimum: 1,
    preventDefault: true,
    allowClicks: true,
    clickThreshold: 3
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