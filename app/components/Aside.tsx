import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
      
      // Prevent scroll on body completely, enable only on cart container
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as Element;
        
        // Allow horizontal scrolling in recommended grid
        const recommendedGrid = target.closest('.recommended-grid');
        if (recommendedGrid) {
          // Check if it's primarily horizontal scroll
          if (Math.abs(e.deltaX) > 0 || (e.deltaY !== 0 && recommendedGrid.scrollWidth > recommendedGrid.clientWidth)) {
            e.stopPropagation();
            return;
          }
        }
        
        const cartContainer = target.closest('.cart-content-scrollable');
        
        if (cartContainer) {
          // We're in the cart container, allow scrolling
          const isScrollable = cartContainer.scrollHeight > cartContainer.clientHeight;
          if (isScrollable) {
            e.stopPropagation();
            return;
          }
        }
        
        // Block all other scrolling
        e.preventDefault();
        e.stopPropagation();
      };
      
      document.body.addEventListener('wheel', handleWheel, { passive: false, signal: abortController.signal });
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
      data-aside-type={type}
    >
      <button className="close-outside" onClick={close} />
      <aside>
        <header>
          <h3>{heading}</h3>
          <button className="close reset" onClick={close} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <AsideContext.Provider
      value={{
        type,
        open: (mode: AsideType) => {
          // Block during animation
          if (isAnimating) return;
          setType(mode);
        },
        close: () => {
          // Block during animation
          if (isAnimating) return;
          setType('closed');
        },
        isAnimating,
        setIsAnimating,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
