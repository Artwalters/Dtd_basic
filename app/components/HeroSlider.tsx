import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import gsap from 'gsap';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from 'gsap/InertiaPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, InertiaPlugin);
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

  const updateCurrentSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !sliderRef.current || slides.length === 0) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initHeroSlider(sliderRef.current, updateCurrentSlide);
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup draggable on unmount
      if (sliderRef.current) {
        const root = sliderRef.current as HTMLElement & {_heroSliderDraggable?: any};
        if (root._heroSliderDraggable) {
          root._heroSliderDraggable.kill();
        }
      }
    };
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section
      ref={sliderRef}
      data-gsap-slider-init=""
      aria-label="Hero Slider"
      role="region"
      aria-roledescription="carousel"
      className="hero-slider"
    >
      
      <div data-gsap-slider-collection="" className="hero-slider-collection">
        <div data-gsap-slider-list="" className="hero-slider-track">
          {slides.map((slide, index) => (
            <div key={slide.id} data-gsap-slider-item="" className="hero-slider-slide">
              <div className="hero-slide-background">
                <img src={slide.backgroundImage} alt="" className="hero-slide-image" />
                <div className="hero-slide-gradient" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-bottom">
        <div className="hero-content-row">
          <div className="hero-slide-text">
            <span className="hero-slide-subtitle">{slides[currentSlide]?.subtitle}</span>
            <h1 className="hero-slide-title">{slides[currentSlide]?.title}</h1>
          </div>
          <Link to={slides[currentSlide]?.buttonLink || '/collections/all'} className="btn btn-white">
            {slides[currentSlide]?.buttonText || 'SHOP NOW'}
          </Link>
        </div>
        <div className="hero-slider-progress" data-gsap-slider-progress="">
          <div className="hero-slider-progress-track">
            <div className="hero-slider-progress-fill" data-gsap-slider-progress-fill=""></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// GSAP Hero Slider Initialization Function
function initHeroSlider(specificRoot?: HTMLElement | null, onSlideChange?: (index: number) => void) {
  if (!specificRoot) return;

  const root = specificRoot;
  const el = root as HTMLElement & {_heroSliderDraggable?: any};
  if (el._heroSliderDraggable) el._heroSliderDraggable.kill();

  const collection = root.querySelector('[data-gsap-slider-collection]') as HTMLElement;
  const track = root.querySelector('[data-gsap-slider-list]') as HTMLElement;
  const items = Array.from(root.querySelectorAll('[data-gsap-slider-item]')) as HTMLElement[];
  const controls = Array.from(root.querySelectorAll('[data-gsap-slider-control]')) as HTMLButtonElement[];

  if (!collection || !track || items.length === 0) return;

  // Inject aria attributes
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Hero Slider');
  collection.setAttribute('role', 'group');
  collection.setAttribute('aria-roledescription', 'Slides List');
  collection.setAttribute('aria-label', 'Hero Slides');
  items.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'Slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${items.length}`);
    slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    slide.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    slide.setAttribute('tabindex', i === 0 ? '0' : '-1');
  });

  // Hero slider always runs - full width slides
  const slideWidth = collection.clientWidth;
  const maxScroll = (items.length - 1) * slideWidth;
  const minX = -maxScroll;
  const maxX = 0;
  const snapPoints: number[] = [];
  
  for (let i = 0; i < items.length; i++) {
    snapPoints.push(-i * slideWidth);
  }

  let activeIndex = 0;
  const setX = gsap.quickSetter(track, 'x', 'px');
  let collectionRect = collection.getBoundingClientRect();

  function updateStatus(x: number) {
    if (x > maxX || x < minX) {
      return;
    }

    // Clamp and find closest snap
    const calcX = x > maxX ? maxX : (x < minX ? minX : x);
    let closest = snapPoints[0];
    snapPoints.forEach(pt => {
      if (Math.abs(pt - calcX) < Math.abs(closest - calcX)) {
        closest = pt;
      }
    });
    activeIndex = snapPoints.indexOf(closest);

    // Notify React component of slide change
    if (onSlideChange) {
      onSlideChange(activeIndex);
    }

    // Update Slide Attributes
    items.forEach((slide, i) => {
      const status = i === activeIndex ? 'active' : 'not-active';
      slide.setAttribute('data-gsap-slider-item-status', status);
      slide.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      slide.setAttribute('aria-hidden', i === activeIndex ? 'false' : 'true');
      slide.setAttribute('tabindex', i === activeIndex ? '0' : '-1');
    });

    // Update Controls
    controls.forEach(btn => {
      const dir = btn.getAttribute('data-gsap-slider-control');
      const can = dir === 'prev'
        ? activeIndex > 0
        : activeIndex < snapPoints.length - 1;

      btn.disabled = !can;
      btn.setAttribute('aria-disabled', can ? 'false' : 'true');
      btn.setAttribute('data-gsap-slider-control-status', can ? 'active' : 'not-active');
    });

    // Update Progress Bar
    const progressFill = root.querySelector('[data-gsap-slider-progress-fill]') as HTMLElement;
    if (progressFill && snapPoints.length > 0) {
      const progress = activeIndex / (snapPoints.length - 1);
      const percentage = progress * 100;
      progressFill.style.transform = `translateX(${percentage * 2}%)`;
    }
  }

  // Store click handlers to remove them on cleanup
  const clickHandlers: Array<{btn: HTMLButtonElement; handler: () => void}> = [];

  controls.forEach(btn => {
    const dir = btn.getAttribute('data-gsap-slider-control');
    const handler = () => {
      if (btn.disabled) return;
      const delta = dir === 'next' ? 1 : -1;
      const target = activeIndex + delta;
      gsap.to(track, {
        duration: 0.6,
        x: snapPoints[target],
        onUpdate: () => updateStatus(gsap.getProperty(track, 'x') as number)
      });
    };
    btn.addEventListener('click', handler);
    clickHandlers.push({btn, handler});
  });

  // Initialize Draggable
  el._heroSliderDraggable = Draggable.create(track, {
    type: 'x',
    inertia: true,
    bounds: {minX, maxX},
    throwResistance: 2000,
    dragResistance: 0.05,
    maxDuration: 0.8,
    minDuration: 0.3,
    edgeResistance: 0.75,
    snap: {x: snapPoints, duration: 0.6},
    onPress() {
      track.setAttribute('data-gsap-slider-list-status', 'grabbing');
      collectionRect = collection.getBoundingClientRect();
    },
    onDrag() {
      setX(this.x);
      updateStatus(this.x);
    },
    onThrowUpdate() {
      setX(this.x);
      updateStatus(this.x);
    },
    onThrowComplete() {
      setX(this.endX);
      updateStatus(this.endX);
      track.setAttribute('data-gsap-slider-list-status', 'grab');
    },
    onRelease() {
      setX(this.x);
      updateStatus(this.x);
      track.setAttribute('data-gsap-slider-list-status', 'grab');
    }
  })[0];

  // Track hover state
  track.onmouseenter = () => {
    track.setAttribute('data-gsap-slider-list-status', 'grab');
  };
  track.onmouseleave = () => {
    track.removeAttribute('data-gsap-slider-list-status');
  };

  // Initial state
  setX(0);
  updateStatus(0);
}