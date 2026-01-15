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
}

interface ModelProps {
  isActive: boolean;
}

function FullLogoModel({isActive}: ModelProps) {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    const material = createMetallicMaterial();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene]);

  // Animate in/out
  useFrame(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      // Check if user has scrolled to the bottom (where sticky footer becomes visible)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Footer becomes visible in the last 10% of scroll
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      const target = isActive && !footerVisibleRef.current ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 3.557 * progress;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

function SmallLogoModel({isActive}: ModelProps) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7_nav.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const rotationInitialized = useRef(false);
  const footerVisibleRef = useRef(false);

  // Clone scene and apply metallic material to avoid conflicts with other Canvas instances
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    const material = createMetallicMaterial();
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

  // Animate in/out + rotate based on scroll
  useFrame(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      // Check if user has scrolled to the bottom (where sticky footer becomes visible)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Footer becomes visible in the last 10% of scroll
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      // Scale animation
      const target = isActive && !footerVisibleRef.current ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 1.65 * progress;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;

      // Scroll-based rotation (base rotation is on primitive, scroll adds to group)
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      const targetY = scrollProgress * Math.PI * 2;

      // Initialize rotation immediately on first frame
      if (!rotationInitialized.current) {
        groupRef.current.rotation.y = targetY;
        rotationInitialized.current = true;
      } else {
        groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

export default function NavbarLogo3D({isScrolled}: NavbarLogo3DProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
          <FullLogoModel isActive={!isScrolled} />
          <SmallLogoModel isActive={isScrolled} />
          <Environment files="/3D/studio_small_09_1k.hdr" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full_optimized.glb', '/draco/');
useGLTF.preload('/3D/dtd_logo7_nav.glb', '/draco/');
