import {Canvas, useFrame} from '@react-three/fiber';
import {useGLTF, useAnimations, Environment} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface NavbarLogo3DProps {
  isScrolled: boolean;
  isMenuOpen?: boolean;
}

// Menu animation phases for mobile
type MenuAnimationPhase = 'idle' | 'small-logo-spinning' | 'full-logo-black' | 'closing-spinning';

// Animation timing constants (ms)
const SPIN_DURATION = 1000;
const CLOSE_SPIN_DURATION = 1200;

interface ModelProps {
  isActive: boolean;
  isMenuOpen?: boolean;
  logoScale?: number;
  isHovered?: boolean;
  menuAnimationPhase?: MenuAnimationPhase;
}

function FullLogoModel({isActive, isMenuOpen = false, logoScale = 1, menuAnimationPhase = 'idle'}: ModelProps) {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const colorProgress = useRef(0); // 0 = white, 1 = black

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
    });
    materialRef.current = material;
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene]);

  // Animate in/out with opacity fade
  useFrame(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      // Check if user has scrolled to the bottom (where sticky footer becomes visible)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Footer becomes visible in the last 10% of scroll
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      // Phase-based logic for menu animation with smooth fade
      const isSpinning = menuAnimationPhase === 'small-logo-spinning' || menuAnimationPhase === 'closing-spinning';

      let target: number;
      if (isSpinning) {
        // Hide full logo while small logo is spinning
        target = 0;
      } else if (menuAnimationPhase === 'full-logo-black') {
        // Show full logo after spin
        target = 1;
      } else {
        // Normal: show when at top (isActive) or menu open
        target = (isMenuOpen || isActive) && !footerVisibleRef.current ? 1 : 0;
      }

      // Smooth fade - same speed as scroll transition
      animProgress.current += (target - animProgress.current) * 0.15;

      const progress = animProgress.current;
      const scale = 3.557 * progress * logoScale;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.05;

      // Fade opacity much faster so zoom-out isn't visible
      if (materialRef.current) {
        materialRef.current.opacity = Math.pow(progress, 4);

        // Smoothly transition color: black when menu animation is in full-logo-black phase, white otherwise
        const targetColor = menuAnimationPhase === 'full-logo-black' ? 1 : 0;
        colorProgress.current += (targetColor - colorProgress.current) * 0.1;

        // Interpolate between white (0xffffff) and black (0x000000)
        const colorValue = Math.round(255 * (1 - colorProgress.current));
        materialRef.current.color.setRGB(colorValue / 255, colorValue / 255, colorValue / 255);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

function SmallLogoModel({isActive, isMenuOpen = false, logoScale = 1, isHovered = false, menuAnimationPhase = 'idle'}: ModelProps) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7_nav.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Rotation tracking
  const rotationInitialized = useRef(false);
  const menuSpinStartRef = useRef(0);
  const wasSpinningRef = useRef(false);
  const hasReachedTargetRef = useRef(false);

  // Clone scene and apply metallic material to avoid conflicts with other Canvas instances
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.4, 0.4, 0.4),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 0.8,
      transparent: true,
      opacity: 1,
    });
    materialRef.current = material;
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene]);

  // Clone animations for the cloned scene
  const {actions, names} = useAnimations(animations, clonedScene);

  // Play animation
  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().play();
    }
    return () => {
      if (names.length > 0 && actions[names[0]]) {
        actions[names[0]]?.stop();
      }
    };
  }, [actions, names]);

  // Animate in/out + rotate based on scroll direction
  useFrame(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      // Check if user has scrolled to the bottom (where sticky footer becomes visible)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Footer becomes visible in the last 10% of scroll
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      // Phase-based logic for menu animation with smooth fade
      const isSpinning = menuAnimationPhase === 'small-logo-spinning' || menuAnimationPhase === 'closing-spinning';

      let target: number;
      if (isSpinning) {
        // Show small logo during spin
        target = 1;
      } else if (menuAnimationPhase === 'full-logo-black') {
        // Hide small logo when full logo shows
        target = 0;
      } else {
        // Normal: show when scrolled (isActive) and menu not open
        target = isActive && !isMenuOpen && !footerVisibleRef.current ? 1 : 0;
      }

      // Smooth fade - same speed as scroll transition
      animProgress.current += (target - animProgress.current) * 0.15;

      const progress = animProgress.current;
      const scale = 1.65 * progress * logoScale;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.05;

      // Fade opacity much faster so zoom-out isn't visible
      if (materialRef.current) {
        materialRef.current.opacity = Math.pow(progress, 4);
      }

      // Scroll-based rotation: 0% = 0rad (straight), 100% = 4π rad (straight)
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      const targetY = scrollProgress * Math.PI * 4;

      if (isSpinning) {
        // Menu spin - 2 rotations
        if (!wasSpinningRef.current) {
          wasSpinningRef.current = true;
          menuSpinStartRef.current = groupRef.current.rotation.y;
        }
        const targetRotation = Math.ceil((menuSpinStartRef.current + Math.PI * 4) / Math.PI) * Math.PI;
        groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.10;

        if (Math.abs(targetRotation - groupRef.current.rotation.y) < 0.1 && !hasReachedTargetRef.current && menuAnimationPhase === 'small-logo-spinning') {
          hasReachedTargetRef.current = true;
          window.dispatchEvent(new CustomEvent('logoFacingForward'));
        }
      } else {
        wasSpinningRef.current = false;
        hasReachedTargetRef.current = false;

        // Direct scroll rotation
        if (!rotationInitialized.current) {
          groupRef.current.rotation.y = targetY;
          rotationInitialized.current = true;
        } else {
          groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.15;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

export default function NavbarLogo3D({isScrolled, isMenuOpen}: NavbarLogo3DProps) {
  const [isClient, setIsClient] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [menuAnimationPhase, setMenuAnimationPhase] = useState<MenuAnimationPhase>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const wasMenuOpenRef = useRef(false);
  const isMountedRef = useRef(true);
  const menuOpenTimeRef = useRef<number | null>(null);
  const menuCloseTimeRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    setIsClient(true);

    // Responsive scale based on viewport width
    function updateScale(): void {
      if (!isMountedRef.current) return;
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 480) {
        setLogoScale(0.85);
      } else if (width < 1400) {
        setLogoScale(0.65);
      } else if (width < 1600) {
        setLogoScale(0.75);
      } else {
        setLogoScale(1);
      }
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Listen for logo facing forward event to switch to full logo immediately
  useEffect(() => {
    const handleLogoFacingForward = () => {
      if (menuAnimationPhase === 'small-logo-spinning') {
        setMenuAnimationPhase('full-logo-black');
        menuOpenTimeRef.current = null; // Stop the timer-based check
      }
    };

    window.addEventListener('logoFacingForward', handleLogoFacingForward);
    return () => window.removeEventListener('logoFacingForward', handleLogoFacingForward);
  }, [menuAnimationPhase]);

  // Handle menu animation phases using interval-based timing
  // Works for both mobile menu and desktop cart
  useEffect(() => {
    // Track menu open/close transitions - set phase immediately
    if (isMenuOpen && !wasMenuOpenRef.current) {
      wasMenuOpenRef.current = true;
      menuOpenTimeRef.current = performance.now();
      menuCloseTimeRef.current = null;
      setMenuAnimationPhase('small-logo-spinning'); // Start spinning immediately
    } else if (!isMenuOpen && wasMenuOpenRef.current) {
      wasMenuOpenRef.current = false;
      menuCloseTimeRef.current = performance.now();
      menuOpenTimeRef.current = null;
      setMenuAnimationPhase('closing-spinning'); // Start closing spin immediately
    }

    // Update phase based on elapsed time (only for closing animation now)
    const updatePhase = () => {
      const now = performance.now();

      // Opening: still use timer as fallback, but logoFacingForward event should trigger first
      if (menuOpenTimeRef.current !== null) {
        const elapsed = now - menuOpenTimeRef.current;
        const newPhase = elapsed < SPIN_DURATION ? 'small-logo-spinning' : 'full-logo-black';
        if (menuAnimationPhase !== newPhase) setMenuAnimationPhase(newPhase);
      } else if (menuCloseTimeRef.current !== null) {
        const elapsed = now - menuCloseTimeRef.current;
        if (elapsed < CLOSE_SPIN_DURATION) {
          if (menuAnimationPhase !== 'closing-spinning') setMenuAnimationPhase('closing-spinning');
        } else if (menuAnimationPhase !== 'idle') {
          setMenuAnimationPhase('idle');
          menuCloseTimeRef.current = null;
        }
      }
    };

    const intervalId = setInterval(updatePhase, 16);
    return () => clearInterval(intervalId);
  }, [isMenuOpen, isMobile, menuAnimationPhase]);

  if (!isClient) return null;

  return (
    <div className="navbar-logo-3d">
      <Canvas
        camera={{position: [0, 0, 25], fov: 25}}
        dpr={[1, 2]}
        gl={{antialias: true, alpha: true}}
      >
        <Suspense fallback={null}>
          <FullLogoModel
            isActive={!isScrolled}
            isMenuOpen={isMenuOpen}
            logoScale={logoScale}
            menuAnimationPhase={menuAnimationPhase}
          />
          <SmallLogoModel
            isActive={isScrolled}
            isMenuOpen={isMenuOpen}
            logoScale={logoScale}
            isHovered={isHovered}
            menuAnimationPhase={menuAnimationPhase}
          />
          <Environment files="/3D/studio_small_09_1k.hdr" />
        </Suspense>
      </Canvas>
      {/* Hitbox for hover detection */}
      <div
        className="navbar-logo-hitbox"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full_optimized.glb', '/draco/');
useGLTF.preload('/3D/dtd_logo7_nav.glb', '/draco/');
