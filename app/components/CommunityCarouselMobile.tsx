import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {Suspense, useRef, useMemo, useEffect, useState} from 'react';
import * as THREE from 'three';

// Images
const imageUrls = [
  '/Img/6503d875-bea9-44d4-a82b-0bbf235b80bf.webp',
  '/Img/690ad09a-c27c-4078-abb3-800071d7c98d.webp',
  '/Img/8c968cdf-d136-4e8f-8023-0c5bef62d2b5.webp',
  '/Img/DSC04304.webp',
  '/Img/DSC04329.webp',
  '/Img/DSC04476.webp',
  '/Img/DSC04745.webp',
  '/Img/DSC04793.webp',
  '/Img/DSC06673.webp',
  '/Img/DSC06729.webp',
  '/Img/DSC08907.webp',
  '/Img/DSC_7221.webp',
  '/Img/DSC_7306.webp',
];

// Curved Image Carousel
function ImageCarousel({radius = 2, baseSpeed = 0.15, panelCount = 12}: {
  radius?: number;
  baseSpeed?: number;
  panelCount?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useTexture(imageUrls);

  // Set correct color space
  useEffect(() => {
    textures.forEach(texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, [textures]);

  // Auto-rotate (only Y axis, keep tilt fixed)
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * baseSpeed;
    }
  });

  // Create curved geometry for panels
  const curvedGeometry = useMemo(() => {
    const arcAngle = (Math.PI * 2) / panelCount * 0.9;
    const segments = 32;
    const arcLength = radius * arcAngle;
    const height = arcLength;

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      segments,
      1,
      true,
      0,
      arcAngle
    );

    // Fix UV mapping
    const uvAttribute = geometry.getAttribute('uv');
    const uvArray = uvAttribute.array as Float32Array;
    for (let i = 0; i < uvArray.length; i += 2) {
      uvArray[i] = 1 - uvArray[i];
    }
    uvAttribute.needsUpdate = true;

    return geometry;
  }, [panelCount, radius]);

  // Create panels arranged in a circle
  const panels = useMemo(() => {
    const items = [];
    const angleStep = (Math.PI * 2) / panelCount;
    const textureArray = Array.isArray(textures) ? textures : [textures];

    for (let i = 0; i < panelCount; i++) {
      const angle = i * angleStep;
      const textureIndex = i % textureArray.length;

      items.push(
        <mesh
          key={i}
          geometry={curvedGeometry}
          rotation={[0, -angle + Math.PI, 0]}
        >
          <meshBasicMaterial
            map={textureArray[textureIndex]}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      );
    }
    return items;
  }, [panelCount, curvedGeometry, textures]);

  return (
    <group rotation={[0, 0, 0.08]}>
      <group ref={groupRef}>{panels}</group>
    </group>
  );
}

// Scene with fog
function Scene() {
  const {scene} = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#1a1a1a');
  }, [scene]);

  return (
    <>
      <fog attach="fog" args={['#1a1a1a', 1.5, 4]} />
      <Suspense fallback={null}>
        <ImageCarousel radius={1.5} baseSpeed={0.12} panelCount={12} />
      </Suspense>
    </>
  );
}

export function CommunityCarouselMobile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {threshold: 0.1}
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'pan-y',
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{position: [0, 0, 3.5], fov: 50}}
        dpr={Math.min(window.devicePixelRatio || 1, 2)}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{antialias: false, powerPreference: 'low-power'}}
        style={{pointerEvents: 'none'}}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
