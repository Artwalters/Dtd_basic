import {Canvas, useFrame} from '@react-three/fiber';
import {useGLTF, useAnimations, Environment} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Shared metallic material matching community scene style
const createMetallicMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.4, 0.4, 0.4),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 0.8,
  });
};

interface NavbarLogo3DProps {
  isScrolled: boolean;
  isMenuOpen?: boolean;
}

interface ModelProps {
  isActive: boolean;
  isMenuOpen?: boolean;
  logoScale?: number;
  isHovered?: boolean;
}

function FullLogoModel({isActive, isMenuOpen, logoScale = 1, isHovered}: ModelProps) {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);

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

      // When menu is open or at top - show full logo
      const target = (isMenuOpen || isActive) && !footerVisibleRef.current ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 3.557 * progress * logoScale;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;

      // Fade opacity faster as it zooms out
      if (materialRef.current) {
        materialRef.current.opacity = Math.pow(progress, 2);
        // Change color to black when menu is open, white otherwise
        const targetColor = isMenuOpen ? 0x000000 : 0xffffff;
        materialRef.current.color.setHex(targetColor);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

function SmallLogoModel({isActive, isMenuOpen, logoScale = 1, isHovered = false}: ModelProps) {
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

      // Scale animation - hide when menu is open
      const target = isActive && !isMenuOpen && !footerVisibleRef.current ? 1 : 0;
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

      if (isHovered) {
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

  useEffect(() => {
    setIsClient(true);

    // Responsive scale based on viewport width
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setLogoScale(0.85); // Larger on phones
      } else if (width < 1400) {
        setLogoScale(0.65); // Smaller on 14" MacBooks and below
      } else if (width < 1600) {
        setLogoScale(0.75); // Slightly smaller on medium screens
      } else {
        setLogoScale(1); // Full size on large screens
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  if (!isClient) return null;

  return (
    <div className="navbar-logo-3d">
      <Canvas
        camera={{position: [0, 0, 25], fov: 25}}
        dpr={[1, 2]}
        gl={{antialias: true, alpha: true}}
      >
        <Suspense fallback={null}>
          <FullLogoModel isActive={!isScrolled} isMenuOpen={isMenuOpen} logoScale={logoScale} />
          <SmallLogoModel isActive={isScrolled} isMenuOpen={isMenuOpen} logoScale={logoScale} isHovered={isHovered} />
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
