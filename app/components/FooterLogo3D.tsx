import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';

// Hook to check if device is touch-only (client-side only, safe for SSR)
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

function FullLogoModel({isTouchDevice, logoScale = 1}: {isTouchDevice: boolean; logoScale?: number}) {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);
  const {pointer} = useThree();

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

  // Subtle mouse interaction
  useFrame(() => {
    if (groupRef.current) {
      if (isTouchDevice) {
        // On touch devices, maintain base rotation
        groupRef.current.rotation.y += ((Math.PI / 2) - groupRef.current.rotation.y) * 0.02;
        groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.02;
      } else {
        // Desktop: subtle tilt based on mouse position
        const targetRotY = (Math.PI / 2) + pointer.x * 0.15;
        const targetRotX = pointer.y * 0.08;

        groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.03;
        groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.03;
      }
    }
  });

  return (
    <group ref={groupRef} scale={2.8 * logoScale}>
      <primitive object={clonedScene} rotation={[0, 0, 0]} />
    </group>
  );
}

export default function FooterLogo3D() {
  const [isClient, setIsClient] = useState(false);
  const [logoScale, setLogoScale] = useState(1);
  const isTouchDevice = useIsTouchDevice();

  useEffect(() => {
    setIsClient(true);

    // Responsive scale based on viewport width
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 1400) {
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
    <div className="footer-logo-3d">
      <Canvas
        camera={{position: [0, 0, 25], fov: 25}}
        dpr={[1, 2]}
        gl={{antialias: true, alpha: true}}
      >
        <Suspense fallback={null}>
          <FullLogoModel isTouchDevice={isTouchDevice} logoScale={logoScale} />
        </Suspense>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1.5} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full_optimized.glb', '/draco/');
