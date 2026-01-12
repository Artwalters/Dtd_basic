import {useRef} from 'react';

export function useHeaderScroll() {
  const headerRef = useRef<HTMLElement>(null);
  return headerRef;
}
