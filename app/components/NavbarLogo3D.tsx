import {Canvas, useFrame} from '@react-three/fiber';
import {useGLTF, useAnimations} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface NavbarLogo3DProps {
  isScrolled: boolean;
}

function FullLogoModel() {
  const {scene} = useGLTF('/3D/Daretodream_full.glb', '/draco/');

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={clonedScene} scale={3.42} rotation={[0, Math.PI / 2, 0]} />;
}

function SmallLogoModel() {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const modelRef = useRef<THREE.Group>(null);

  // Clone scene and apply white material to avoid conflicts with other Canvas instances
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
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

  // Rotate based on scroll position
  useFrame(() => {
    if (modelRef.current && typeof window !== 'undefined') {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;

      // Start at -90 degrees (facing forward), full rotation over page, end at -90 degrees
      const baseRotation = -Math.PI / 2;
      const targetY = baseRotation + scrollProgress * Math.PI * 2;

      // Smooth interpolation for fluid motion
      modelRef.current.rotation.y += (targetY - modelRef.current.rotation.y) * 0.05;
    }
  });

  return <primitive ref={modelRef} object={clonedScene} scale={1.52} />;
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
          {!isScrolled && <FullLogoModel />}
          {isScrolled && <SmallLogoModel />}
        </Suspense>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1.5} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full.glb', '/draco/');
useGLTF.preload('/3D/dtd_logo7.glb', '/draco/');
