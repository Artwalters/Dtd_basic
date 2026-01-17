import {Canvas, useFrame} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {Suspense, useRef, useMemo, useEffect} from 'react';
import * as THREE from 'three';

interface ProgressBarMeshProps {
  progress: number;
}

function ProgressBarMesh({progress}: ProgressBarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trackRef = useRef<THREE.Mesh>(null);

  // Metallic material for the fill bar (same as logo)
  const fillMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.25, 0.25, 0.25),
      metalness: 1,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });
  }, []);

  // Dark track material
  const trackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.08, 0.08, 0.08),
      metalness: 0.8,
      roughness: 0.6,
      envMapIntensity: 0.3,
    });
  }, []);

  // Bar dimensions
  const barWidth = 4;
  const barHeight = 0.08;
  const barDepth = 0.08;

  // Animate scale based on progress
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = Math.max(0.001, progress);
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1;
      // Keep the bar anchored to the left
      meshRef.current.position.x = -barWidth / 2 + (meshRef.current.scale.x * barWidth) / 2;
    }
  });

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      fillMaterial.dispose();
      trackMaterial.dispose();
    };
  }, [fillMaterial, trackMaterial]);

  return (
    <group>
      {/* Track (background bar) */}
      <mesh ref={trackRef} position={[0, 0, -0.01]}>
        <boxGeometry args={[barWidth, barHeight, barDepth]} />
        <primitive object={trackMaterial} attach="material" />
      </mesh>

      {/* Fill bar (progress indicator) */}
      <mesh ref={meshRef} scale={[progress, 1, 1]} position={[-barWidth / 2 + (progress * barWidth) / 2, 0, 0]}>
        <boxGeometry args={[barWidth, barHeight, barDepth]} />
        <primitive object={fillMaterial} attach="material" />
      </mesh>
    </group>
  );
}

interface MetallicProgressBarProps {
  progress: number;
  className?: string;
}

export function MetallicProgressBar({progress, className = ''}: MetallicProgressBarProps) {
  return (
    <div className={`metallic-progress-bar ${className}`}>
      <Canvas
        camera={{position: [0, 0, 3], fov: 50}}
        dpr={[1, 2]}
        gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      >
        <Suspense fallback={null}>
          <ProgressBarMesh progress={progress} />
          <Environment files="/3D/studio_small_09_1k.hdr" />
        </Suspense>
      </Canvas>
    </div>
  );
}
