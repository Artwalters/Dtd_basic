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

interface ModelProps {
  isActive: boolean;
  logoScale?: number;
  isHovered?: boolean;
  menuAnimationPhase?: MenuAnimationPhase;
}

function FullLogoModel({isActive, logoScale = 1, menuAnimationPhase = 'idle'}: ModelProps) {
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

      // On mobile during menu animation: hide during spinning phases, show during full-logo phase
      // On desktop: show when at top (not scrolled)
      let target: number;
      if (menuAnimationPhase === 'small-logo-spinning' || menuAnimationPhase === 'closing-spinning') {
        // Hide full logo while small logo is spinning (both opening and closing)
        target = 0;
      } else if (menuAnimationPhase === 'full-logo-black') {
        // Show full logo (black) - always show in menu, ignore footer visibility
        target = 1;
      } else {
        // Normal behavior: show when at top (not scrolled) and footer not visible
        target = isActive && !footerVisibleRef.current ? 1 : 0;
      }

      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 3.557 * progress * logoScale;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;

      // Fade opacity faster as it zooms out
      if (materialRef.current) {
        materialRef.current.opacity = Math.pow(progress, 2);

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

function SmallLogoModel({isActive, logoScale = 1, isHovered = false, menuAnimationPhase = 'idle'}: ModelProps) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7_nav.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Rotation tracking
  const rotationRef = useRef(0);
  const rotationVelocityRef = useRef(0.005); // Base auto-rotation speed
  const lastScrollRef = useRef(0);
  const rotationDirectionRef = useRef(1); // 1 or -1, flips based on scroll direction

  // Menu spin animation tracking
  const menuSpinStartRef = useRef(0);
  const wasSpinningRef = useRef(false);

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

      // Scale animation - show during menu spinning phases or when scrolled (normal behavior)
      let target: number;
      const isSpinning = menuAnimationPhase === 'small-logo-spinning' || menuAnimationPhase === 'closing-spinning';
      if (isSpinning) {
        // Show small logo during spinning phase (both opening and closing)
        target = 1;

        // Track spin start position
        if (!wasSpinningRef.current) {
          wasSpinningRef.current = true;
          menuSpinStartRef.current = rotationRef.current;
        }
      } else {
        // Reset spin tracking when not spinning
        wasSpinningRef.current = false;

        // Normal behavior: show when scrolled (isActive) and not in menu animation
        target = isActive && menuAnimationPhase === 'idle' && !footerVisibleRef.current ? 1 : 0;
      }

      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 1.65 * progress * logoScale;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;

      // Fade opacity faster as it zooms out
      if (materialRef.current) {
        materialRef.current.opacity = Math.pow(progress, 2);
      }

      // Calculate scroll delta for direction
      const scrollDelta = scrollY - lastScrollRef.current;
      lastScrollRef.current = scrollY;

      // Flip rotation direction based on scroll direction
      if (scrollDelta > 2) {
        rotationDirectionRef.current = 1; // Scroll down
      } else if (scrollDelta < -2) {
        rotationDirectionRef.current = -1; // Scroll up
      }

      // Menu spin animation - 2 rotations, ending at forward-facing position
      if (isSpinning) {
        // Calculate target that makes ~2 rotations AND ends at forward-facing position (multiple of π)
        const minRotation = menuSpinStartRef.current + Math.PI * 4; // At least 2 full rotations
        // Round up to nearest multiple of Math.PI so logo ends facing forward
        const targetRotation = Math.ceil(minRotation / Math.PI) * Math.PI;
        const spinSpeed = 0.08; // Fast easing
        rotationRef.current += (targetRotation - rotationRef.current) * spinSpeed;
        rotationVelocityRef.current = 0; // Reset velocity for smooth transition back
      } else if (isHovered) {
        // On hover, smoothly rotate to nearest forward-facing position
        // Logo is symmetric, so 0 and Math.PI (180°) both look the same
        rotationVelocityRef.current *= 0.9; // Slow down

        // Find nearest multiple of Math.PI (0, π, 2π, -π, etc.)
        const nearestMultiple = Math.round(rotationRef.current / Math.PI) * Math.PI;
        rotationRef.current += (nearestMultiple - rotationRef.current) * 0.08;
      } else {
        // Base auto-rotation speed, direction flips based on last scroll
        const baseSpeed = 0.003 * rotationDirectionRef.current;

        // Add scroll speed boost - faster scroll = faster rotation
        const scrollBoost = Math.abs(scrollDelta) * 0.0012 * rotationDirectionRef.current;
        const targetSpeed = baseSpeed + scrollBoost;

        // Smoothly blend velocity towards target
        rotationVelocityRef.current += (targetSpeed - rotationVelocityRef.current) * 0.03;

        // Apply rotation
        rotationRef.current += rotationVelocityRef.current;
      }

      groupRef.current.rotation.y = rotationRef.current;
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

  // Handle menu animation phases on mobile
  // Track when menu opened/closed and calculate phase based on elapsed time
  useEffect(() => {
    if (!isMobile) {
      setMenuAnimationPhase('idle');
      wasMenuOpenRef.current = false;
      menuOpenTimeRef.current = null;
      menuCloseTimeRef.current = null;
      return;
    }

    if (isMenuOpen && !wasMenuOpenRef.current) {
      // Menu is opening on mobile
      wasMenuOpenRef.current = true;
      menuOpenTimeRef.current = performance.now();
      menuCloseTimeRef.current = null;
    } else if (!isMenuOpen && wasMenuOpenRef.current) {
      // Menu is closing
      wasMenuOpenRef.current = false;
      menuCloseTimeRef.current = performance.now();
      menuOpenTimeRef.current = null;
    }
  }, [isMenuOpen, isMobile]);

  // Calculate the current phase based on timing - runs every frame via interval
  useEffect(() => {
    if (!isMobile) return;

    const updatePhase = () => {
      const now = performance.now();

      if (menuOpenTimeRef.current !== null) {
        // Menu is open or opening
        const elapsed = now - menuOpenTimeRef.current;
        if (elapsed < 2800) {
          if (menuAnimationPhase !== 'small-logo-spinning') {
            setMenuAnimationPhase('small-logo-spinning');
          }
        } else {
          if (menuAnimationPhase !== 'full-logo-black') {
            setMenuAnimationPhase('full-logo-black');
          }
        }
      } else if (menuCloseTimeRef.current !== null) {
        // Menu is closing
        const elapsed = now - menuCloseTimeRef.current;
        if (elapsed < 2000) {
          if (menuAnimationPhase !== 'closing-spinning') {
            setMenuAnimationPhase('closing-spinning');
          }
        } else {
          if (menuAnimationPhase !== 'idle') {
            setMenuAnimationPhase('idle');
            menuCloseTimeRef.current = null; // Clear after reaching idle
          }
        }
      }
    };

    // Run phase check frequently (60fps)
    const intervalId = setInterval(updatePhase, 16);

    return () => {
      clearInterval(intervalId);
    };
  }, [isMobile, menuAnimationPhase]);


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
            logoScale={logoScale}
            menuAnimationPhase={menuAnimationPhase}
          />
          <SmallLogoModel
            isActive={isScrolled}
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
