import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ProductCard} from './ProductCard';
import gsap from 'gsap';
import {Draggable} from 'gsap/Draggable';
import {InertiaPlugin} from 'gsap/InertiaPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

interface NewArrivalsProps {
  products: CollectionItemFragment[];
  title?: string;
}

export function NewArrivals({
  products,
  title = 'New Arrivals',
}: NewArrivalsProps) {
  const sliderRef = useRef<HTMLElement>(null);
  const [openProductId, setOpenProductId] = useState<string | null>(null);

  const handleToggle = (productId: string) => {
    setOpenProductId(openProductId === productId ? null : productId);
  };

  // Listen for closeQuickAdd event from header nav clicks
  useEffect(() => {
    const handleCloseQuickAdd = () => {
      setOpenProductId(null);
    };
    window.addEventListener('closeQuickAdd', handleCloseQuickAdd);
    return () => window.removeEventListener('closeQuickAdd', handleCloseQuickAdd);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !sliderRef.current) return;

    const cleanup = initBasicGSAPSlider(sliderRef.current);

    return cleanup;
  }, [products]);

  return (
    <section
      ref={sliderRef}
      data-gsap-slider-init=""
      aria-label="Slider"
      role="region"
      aria-roledescription="carousel"
      className="new-arrivals"
      data-cursor="click & drag"
    >
      <div className="section-divider" />
      <div className="new-arrivals-header">
        <h2 className="new-arrivals-title">{title}</h2>
        <div className="new-arrivals-progress" data-gsap-slider-progress="">
          <div className="progress-track">
            <div className="progress-fill new-arrivals-progress-fill" data-gsap-slider-progress-fill=""></div>
          </div>
        </div>
        <Link to="/collections/all" className="btn btn-glass new-arrivals-shop-all">
          Shop all
        </Link>
      </div>
      <div data-gsap-slider-collection="" className="new-arrivals-collection">
        <div data-gsap-slider-list="" className="new-arrivals-track">
          {products.map((product) => (
            <div key={product.id} data-gsap-slider-item="" className="new-arrivals-slide">
              <ProductCard
                product={product}
                isOpen={openProductId === product.id}
                onToggle={() => handleToggle(product.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// GSAP Slider Initialization Function (Osmo)
function initBasicGSAPSlider(specificRoot?: HTMLElement | null): (() => void) | undefined {
  if (!specificRoot) return;

  const root = specificRoot;
  const el = root as HTMLElement & {_sliderDraggable?: Draggable};
  if (el._sliderDraggable) el._sliderDraggable.kill();

  const collection = root.querySelector('[data-gsap-slider-collection]') as HTMLElement;
  const track = root.querySelector('[data-gsap-slider-list]') as HTMLElement;
  const items = Array.from(root.querySelectorAll('[data-gsap-slider-item]')) as HTMLElement[];
  const controls = Array.from(root.querySelectorAll('[data-gsap-slider-control]')) as HTMLButtonElement[];

  // Store cleanup functions
  const cleanupFns: (() => void)[] = [];

  if (!collection || !track || items.length === 0) {
    return () => {};
  }

  // Inject aria attributes
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Slider');
  collection.setAttribute('role', 'group');
  collection.setAttribute('aria-roledescription', 'Slides List');
  collection.setAttribute('aria-label', 'Slides');
  items.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'Slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${items.length}`);
    slide.setAttribute('aria-hidden', 'true');
    slide.setAttribute('aria-selected', 'false');
    slide.setAttribute('tabindex', '-1');
  });
  controls.forEach(btn => {
    const dir = btn.getAttribute('data-gsap-slider-control');
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous Slide' : 'Next Slide');
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
  });

  // Determine if slider runs
  const styles = getComputedStyle(root);
  const statusVar = styles.getPropertyValue('--slider-status').trim();
  let spvVar = parseFloat(styles.getPropertyValue('--slider-spv'));
  const rect = items[0].getBoundingClientRect();
  const marginRight = parseFloat(getComputedStyle(items[0]).marginRight);
  const slideW = rect.width + marginRight;
  if (isNaN(spvVar)) {
    spvVar = collection.clientWidth / slideW;
  }
  const spv = Math.max(1, Math.min(spvVar, items.length));
  const sliderEnabled = statusVar === 'on' && spv < items.length;
  root.setAttribute('data-gsap-slider-status', sliderEnabled ? 'active' : 'not-active');

  if (!sliderEnabled) {
    // Teardown when disabled
    track.removeAttribute('style');
    track.onmouseenter = null;
    track.onmouseleave = null;
    track.removeAttribute('data-gsap-slider-list-status');
    root.removeAttribute('role');
    root.removeAttribute('aria-roledescription');
    root.removeAttribute('aria-label');
    collection.removeAttribute('role');
    collection.removeAttribute('aria-roledescription');
    collection.removeAttribute('aria-label');
    items.forEach(slide => {
      slide.removeAttribute('role');
      slide.removeAttribute('aria-roledescription');
      slide.removeAttribute('aria-label');
      slide.removeAttribute('aria-hidden');
      slide.removeAttribute('aria-selected');
      slide.removeAttribute('tabindex');
      slide.removeAttribute('data-gsap-slider-item-status');
    });
    controls.forEach(btn => {
      btn.disabled = false;
      btn.removeAttribute('role');
      btn.removeAttribute('aria-label');
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('data-gsap-slider-control-status');
    });
    return () => {};
  }

  // Track hover state
  const handleMouseEnter = () => {
    track.setAttribute('data-gsap-slider-list-status', 'grab');
  };
  const handleMouseLeave = () => {
    track.removeAttribute('data-gsap-slider-list-status');
  };
  track.addEventListener('mouseenter', handleMouseEnter);
  track.addEventListener('mouseleave', handleMouseLeave);
  cleanupFns.push(() => {
    track.removeEventListener('mouseenter', handleMouseEnter);
    track.removeEventListener('mouseleave', handleMouseLeave);
  });

  // Calculate bounds and snap points
  const vw = collection.clientWidth;
  const tw = track.scrollWidth;
  const maxScroll = Math.max(tw - vw, 0);
  const minX = -maxScroll;
  const maxX = 0;
  const maxIndex = maxScroll / slideW;
  const full = Math.floor(maxIndex);
  const snapPoints: number[] = [];
  for (let i = 0; i <= full; i++) {
    snapPoints.push(-i * slideW);
  }
  if (full < maxIndex) {
    snapPoints.push(-maxIndex * slideW);
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

    // Update Slide Attributes
    items.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const leftEdge = r.left - collectionRect.left;
      const slideCenter = leftEdge + r.width / 2;
      const inView = slideCenter > 0 && slideCenter < collectionRect.width;
      const status = i === activeIndex ? 'active' : inView ? 'inview' : 'not-active';

      slide.setAttribute('data-gsap-slider-item-status', status);
      slide.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      slide.setAttribute('aria-hidden', inView ? 'false' : 'true');
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

    // Update Progress Bar (same system as hero slider)
    const progressFill = root.querySelector('[data-gsap-slider-progress-fill]') as HTMLElement;
    if (progressFill && snapPoints.length > 1) {
      // Set width based on number of positions (like hero slider)
      progressFill.style.width = `${100 / snapPoints.length}%`;
      // Move with translateX
      const progress = activeIndex / (snapPoints.length - 1);
      progressFill.style.transform = `translateX(${progress * 100 * (snapPoints.length - 1)}%)`;
    }
  }

  // Add click handlers to controls
  controls.forEach(btn => {
    const dir = btn.getAttribute('data-gsap-slider-control');
    const handler = () => {
      if (btn.disabled) return;
      const delta = dir === 'next' ? 1 : -1;
      const target = activeIndex + delta;
      gsap.to(track, {
        duration: 0.4,
        x: snapPoints[target],
        onUpdate: () => updateStatus(gsap.getProperty(track, 'x') as number)
      });
    };
    btn.addEventListener('click', handler);
    cleanupFns.push(() => btn.removeEventListener('click', handler));
  });

  // Initialize Draggable
  el._sliderDraggable = Draggable.create(track, {
    type: 'x',
    inertia: true,
    bounds: {minX, maxX},
    throwResistance: 2000,
    dragResistance: 0.05,
    maxDuration: 0.6,
    minDuration: 0.2,
    edgeResistance: 0.75,
    snap: {x: snapPoints, duration: 0.4},
    onPress() {
      track.setAttribute('data-gsap-slider-list-status', 'grabbing');
      collectionRect = collection.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('swiper-drag-start'));
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
      window.dispatchEvent(new CustomEvent('swiper-drag-end'));
    },
    onRelease() {
      setX(this.x);
      updateStatus(this.x);
      track.setAttribute('data-gsap-slider-list-status', 'grab');
      window.dispatchEvent(new CustomEvent('swiper-drag-end'));
    }
  })[0];

  cleanupFns.push(() => {
    if (el._sliderDraggable) {
      el._sliderDraggable.kill();
      el._sliderDraggable = undefined;
    }
  });

  // Initial state
  setX(0);
  updateStatus(0);

  // Return cleanup function
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}
