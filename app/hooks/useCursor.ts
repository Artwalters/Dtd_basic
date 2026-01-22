import {useEffect, useRef} from 'react';
import gsap from 'gsap';

export function useCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const paragraph = cursor.querySelector('p') as HTMLParagraphElement;
    if (!paragraph) return;

    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    let isInTarget = false;
    let currentTarget: HTMLElement | null = null;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let lastStillX = 0;
    let lastStillY = 0;
    let stillnessTimer: ReturnType<typeof setTimeout> | null = null;
    let delayedTooltipActive = false; // Track if delayed tooltip is shown
    const STILLNESS_THRESHOLD = 8; // pixels - cursor must stay within this range
    const STILLNESS_DELAY = 600; // ms - how long cursor must be still

    // Position offset from cursor
    gsap.set(cursor, {xPercent: 10, yPercent: 10});

    // Smooth follow animation
    const xTo = gsap.quickTo(cursor, 'x', {duration: 0.08, ease: 'power2'});
    const yTo = gsap.quickTo(cursor, 'y', {duration: 0.08, ease: 'power2'});

    const setText = (text: string) => {
      paragraph.textContent = text;
    };

    const showTooltip = (target: HTMLElement) => {
      // Check if this target has a delayed tooltip
      const isDelayed = target.hasAttribute('data-cursor-delayed');

      if (isDelayed) {
        // Show parent's tooltip text first (e.g. "click & drag")
        const parent = target.parentElement?.closest('[data-cursor]:not([data-cursor-delayed])') as HTMLElement | null;
        if (parent) {
          cursor.classList.add('is-active');
          setText(parent.getAttribute('data-cursor') || '');
        }
        // Stillness check will later change to target's own text
        return;
      }

      cursor.classList.add('is-active');
      setText(target.getAttribute('data-cursor') || '');
    };

    const checkStillness = () => {
      if (!currentTarget || !currentTarget.hasAttribute('data-cursor-delayed')) return;

      const dx = Math.abs(mouseX - lastStillX);
      const dy = Math.abs(mouseY - lastStillY);

      if (dx < STILLNESS_THRESHOLD && dy < STILLNESS_THRESHOLD) {
        // Cursor is still - now show the tooltip and keep it active
        cursor.classList.add('is-active');
        setText(currentTarget.getAttribute('data-cursor') || '');
        delayedTooltipActive = true;
      }
    };

    const startStillnessCheck = () => {
      if (stillnessTimer) clearTimeout(stillnessTimer);
      lastStillX = mouseX;
      lastStillY = mouseY;
      stillnessTimer = setTimeout(checkStillness, STILLNESS_DELAY);
    };

    const hideTooltip = () => {
      cursor.classList.remove('is-active');
      delayedTooltipActive = false;
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
      if (stillnessTimer) {
        clearTimeout(stillnessTimer);
        stillnessTimer = null;
      }
    };

    const getTargetAtPosition = (): HTMLElement | null => {
      const el = document.elementFromPoint(mouseX, mouseY);
      return el?.closest('[data-cursor]') as HTMLElement | null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      xTo(mouseX);
      yTo(mouseY);

      // Check hover state only when not dragging
      if (!isDragging) {
        const target = getTargetAtPosition();
        if (target) {
          if (target !== currentTarget) {
            // Target changed
            if (delayTimer) {
              clearTimeout(delayTimer);
              delayTimer = null;
            }
            if (stillnessTimer) {
              clearTimeout(stillnessTimer);
              stillnessTimer = null;
            }
            delayedTooltipActive = false;
            cursor.classList.remove('is-active');
            currentTarget = target;
            isInTarget = true;
            showTooltip(target);
            // Start stillness check if this is a delayed target
            if (target.hasAttribute('data-cursor-delayed')) {
              startStillnessCheck();
            }
          } else if (target.hasAttribute('data-cursor-delayed') && !delayedTooltipActive) {
            // Same target, cursor moved, tooltip not yet activated - show parent text and restart stillness check
            const parent = target.parentElement?.closest('[data-cursor]:not([data-cursor-delayed])') as HTMLElement | null;
            if (parent) {
              setText(parent.getAttribute('data-cursor') || '');
            }
            startStillnessCheck();
          }
          // If delayedTooltipActive is true, keep showing the target's tooltip
        } else {
          if (isInTarget) {
            currentTarget = null;
            isInTarget = false;
            hideTooltip();
          }
        }
      }
    };

    const handleScroll = () => {
      if (!isDragging && isInTarget) {
        const target = getTargetAtPosition();
        if (!target) {
          currentTarget = null;
          isInTarget = false;
          hideTooltip();
        }
      }
    };

    const handleDragStart = () => {
      isDragging = true;
      hideTooltip();
    };

    const handleQuickAddOpen = () => {
      hideTooltip();
    };

    const handleDragEnd = () => {
      isDragging = false;
      currentTarget = null;
      // Wait 500ms before showing tooltip again
      setTimeout(() => {
        const target = getTargetAtPosition();
        if (target) {
          currentTarget = target;
          isInTarget = true;
          showTooltip(target);
          // Start stillness check if this is a delayed target
          if (target.hasAttribute('data-cursor-delayed')) {
            startStillnessCheck();
          }
        } else {
          isInTarget = false;
        }
      }, 500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, {passive: true});
    window.addEventListener('swiper-drag-start', handleDragStart);
    window.addEventListener('swiper-drag-end', handleDragEnd);
    window.addEventListener('quickadd-open', handleQuickAddOpen);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('swiper-drag-start', handleDragStart);
      window.removeEventListener('swiper-drag-end', handleDragEnd);
      window.removeEventListener('quickadd-open', handleQuickAddOpen);
      if (delayTimer) clearTimeout(delayTimer);
      if (stillnessTimer) clearTimeout(stillnessTimer);
    };
  }, []);

  return cursorRef;
}
