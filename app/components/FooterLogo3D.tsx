import {Canvas, useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect, useRef} from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

function FullLogoModel({mouse}: {mouse: {x: number; y: number}}) {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null);

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

  useFrame(() => {
    if (groupRef.current) {
      // Subtle rotation based on mouse position
      const targetRotationX = mouse.y * 0.15;
      const targetRotationY = Math.PI / 2 + mouse.x * 0.15;

      groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group scale={3.5}>
      <primitive ref={groupRef} object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

export default function FooterLogo3D() {
  const [isClient, setIsClient] = useState(false);
  const [mouse, setMouse] = useState({x: 0, y: 0});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMouse({x, y});
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div className="footer-logo-3d">
      <Canvas
        camera={{position: [0, 0, 25], fov: 25}}
        dpr={[1, 2]}
        gl={{antialias: true, alpha: true}}
      >
        <Suspense fallback={null}>
          <FullLogoModel mouse={mouse} />
        </Suspense>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1.5} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full_optimized.glb', '/draco/');
