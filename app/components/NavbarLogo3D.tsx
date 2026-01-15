import {Canvas, useFrame} from '@react-three/fiber';
import {useGLTF, useAnimations, Environment, useTexture} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface NavbarLogo3DProps {
  isScrolled: boolean;
}

interface ModelProps {
  isActive: boolean;
}

function FullLogoModel({isActive}: ModelProps) {
  const {scene} = useGLTF('/3D/Daretodream_full.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const footerVisibleRef = useRef(false);

  // Load PBR textures (same as community scene)
  const textures = useTexture({
    map: '/3D/textures/Metal055A_1K-JPG_Color_dark.jpg',
    normalMap: '/3D/textures/Metal055A_1K-JPG_NormalGL.jpg',
    roughnessMap: '/3D/textures/Metal055A_1K-JPG_Roughness.jpg',
    metalnessMap: '/3D/textures/Metal055A_1K-JPG_Metalness.jpg',
  });

  // Create PBR material matching community scene
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 0.15,
      color: new THREE.Color(0.4, 0.4, 0.4),
    });
  }, [textures]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene, material]);

  // Animate in/out
  useFrame(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      const target = isActive && !footerVisibleRef.current ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 2.736 * progress;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

function SmallLogoModel({isActive}: ModelProps) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const animProgress = useRef(isActive ? 1 : 0);
  const rotationInitialized = useRef(false);
  const footerVisibleRef = useRef(false);

  // Load PBR textures (same as community scene)
  const textures = useTexture({
    map: '/3D/textures/Metal055A_1K-JPG_Color_dark.jpg',
    normalMap: '/3D/textures/Metal055A_1K-JPG_NormalGL.jpg',
    roughnessMap: '/3D/textures/Metal055A_1K-JPG_Roughness.jpg',
    metalnessMap: '/3D/textures/Metal055A_1K-JPG_Metalness.jpg',
  });

  // Create PBR material matching community scene
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      metalness: 1,
      roughness: 1,
      envMapIntensity: 0.15,
      color: new THREE.Color(0.4, 0.4, 0.4),
    });
  }, [textures]);

  // Clone scene and apply PBR material
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    return clone;
  }, [scene, material]);

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
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      footerVisibleRef.current = maxScroll > 0 && scrollY > maxScroll * 0.98;

      const target = isActive && !footerVisibleRef.current ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.08;

      const progress = animProgress.current;
      const scale = 1.65 * progress;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = progress > 0.01;

      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      const targetY = scrollProgress * Math.PI * 2;

      if (!rotationInitialized.current) {
        groupRef.current.rotation.y = targetY;
        rotationInitialized.current = true;
      } else {
        groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
      }
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

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

useGLTF.preload('/3D/Daretodream_full.glb', '/draco/');
useGLTF.preload('/3D/dtd_logo7.glb', '/draco/');
