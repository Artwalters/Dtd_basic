import {Canvas} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Suspense, useMemo, useState, useEffect} from 'react';
import * as THREE from 'three';

function FullLogoModel() {
  const {scene} = useGLTF('/3D/Daretodream_full_optimized.glb', '/draco/');

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

  return (
    <group scale={2.8}>
      <primitive object={clonedScene} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

export default function FooterLogo3D() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
          <FullLogoModel />
        </Suspense>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1.5} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/3D/Daretodream_full_optimized.glb', '/draco/');
