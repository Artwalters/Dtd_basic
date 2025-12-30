import {Canvas, useFrame, useThree, createPortal} from '@react-three/fiber';
import {OrbitControls, useGLTF, useAnimations, Environment, useTexture, useFBO} from '@react-three/drei';
import {Suspense, useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {useDrag} from '@use-gesture/react';
import * as THREE from 'three';

function Model() {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const {actions, names} = useAnimations(animations, scene);

  // Load PBR textures
  const textures = useTexture({
    map: '/3D/textures/Metal055A_1K-JPG_Color_dark.png',
    normalMap: '/3D/textures/Metal055A_1K-JPG_NormalGL.jpg',
    roughnessMap: '/3D/textures/Metal055A_1K-JPG_Roughness.jpg',
    metalnessMap: '/3D/textures/Metal055A_1K-JPG_Metalness.jpg',
    displacementMap: '/3D/textures/Metal055A_1K-JPG_Displacement.jpg',
  });

  // Create material with textures
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      metalness: 1,
      roughness: 1,
    });
  }, [textures]);

  // Apply material to all meshes in the scene
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }, [scene, material]);

  // Play animation
  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }
    return () => {
      if (names.length > 0 && actions[names[0]]) {
        actions[names[0]]?.fadeOut(0.5);
      }
    };
  }, [actions, names]);

  return <primitive object={scene} scale={0.45} rotation={[0, -Math.PI / 2, 0]} />;
}

// Godray post-processing shaders
const godrayVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const godrayFragmentShader = `
uniform float time;
uniform sampler2D uMap;
varying vec2 vUv;

float PI = 3.141592653589793238;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 toCenter = vec2(0.5) - vUv;
  vec4 original = texture2D(uMap, vUv);

  vec4 color = vec4(0.0);
  float total = 0.0;

  // Radial blur sampling voor godray effect
  for(float i = 0.0; i < 8.0; i++) {
    float lerp = (i + rand(vec2(gl_FragCoord.x, gl_FragCoord.y))) / 8.0;
    float weight = sin(lerp * PI);
    vec4 mysample = texture2D(uMap, vUv + toCenter * lerp * 0.7);
    mysample.rgb *= mysample.a;
    color += mysample * weight;
    total += weight;
  }

  color.a = 1.0;
  color /= total;

  // Godray blending
  vec4 finalColor = mix(original, 1. - (1. - color)*(1. - original), 0.15);

  // Brightness en contrast
  finalColor.rgb *= 1.2;
  finalColor.rgb = pow(finalColor.rgb, vec3(0.95));

  gl_FragColor = finalColor;
}
`;

// Godray Post-Processing Effect
function GodrayEffect({children}: {children: React.ReactNode}) {
  const {gl, scene, camera, size} = useThree();

  // Create render target
  const renderTarget = useFBO(size.width, size.height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: 4,
  });

  // Post-processing scene and camera
  const postScene = useMemo(() => new THREE.Scene(), []);
  const postCamera = useMemo(() => new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000), []);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: {value: null},
        time: {value: 0},
      },
      vertexShader: godrayVertexShader,
      fragmentShader: godrayFragmentShader,
    });
  }, []);

  // Fullscreen quad
  const quad = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    postScene.add(mesh);
    return mesh;
  }, [material, postScene]);

  // Render loop with post-processing
  useFrame((state) => {
    // First pass: render scene to render target
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);

    // Update uniforms
    material.uniforms.uMap.value = renderTarget.texture;
    material.uniforms.time.value = state.clock.elapsedTime;

    // Second pass: render post-processing to screen
    gl.setRenderTarget(null);
    gl.render(postScene, postCamera);
  }, 1);

  // Cleanup
  useEffect(() => {
    return () => {
      material.dispose();
      quad.geometry.dispose();
    };
  }, [material, quad]);

  return <>{children}</>;
}

// 3D Marquee Carousel Component
function ImageCarousel({radius = 2.2, baseSpeed = 0.3, panelCount = 10}: {
  radius?: number;
  baseSpeed?: number;
  panelCount?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeScaleRef = useRef(1);
  const targetTimeScaleRef = useRef(1);
  const {size, viewport} = useThree();

  // Load all images from the Img directory
  const textures = useTexture([
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
  ]);

  // Auto-rotate with smooth inertia
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Lerp timeScale toward target for smooth inertia
    timeScaleRef.current += (targetTimeScaleRef.current - timeScaleRef.current) * 0.05;

    // Apply rotation
    groupRef.current.rotation.y += delta * baseSpeed * timeScaleRef.current;
  });

  // Drag handler - smooth direct control, direction persists on release
  const handleDrag = useCallback((deltaX: number, isDragging: boolean, directionX: number) => {
    if (isDragging) {
      // Direct control while dragging - movement controls speed and direction
      timeScaleRef.current = deltaX * 0.03; // Removed minus sign to reverse direction
      // Track direction for release
      if (Math.abs(deltaX) > 5) {
        targetTimeScaleRef.current = deltaX > 0 ? 1 : -1; // Reversed comparison
      }
    } else {
      // On release: continue in the direction you were dragging
      // targetTimeScaleRef is already set from dragging
    }
  }, []);

  // Expose handler to parent
  useEffect(() => {
    (window as any).__carouselDrag = handleDrag;
    return () => {
      delete (window as any).__carouselDrag;
    };
  }, [handleDrag]);

  // Create curved geometry for panels
  const curvedGeometry = useMemo(() => {
    const arcAngle = (Math.PI * 2) / panelCount * 0.85; // Arc per panel (with small gap)
    const segments = 32; // Smoothness of curve

    // Calculate arc length and scale height
    const arcLength = radius * arcAngle;
    const height = arcLength; // Square panels (1:1 aspect ratio)

    // Create a cylinder segment (curved panel)
    const geometry = new THREE.CylinderGeometry(
      radius, // radiusTop
      radius, // radiusBottom
      height, // height
      segments, // radialSegments
      1, // heightSegments
      true, // openEnded
      0, // thetaStart
      arcAngle // thetaLength
    );

    // Fix UV mapping to prevent stretching
    const uvAttribute = geometry.getAttribute('uv');
    const uvArray = uvAttribute.array as Float32Array;
    for (let i = 0; i < uvArray.length; i += 2) {
      uvArray[i] = 1 - uvArray[i]; // Flip U for correct orientation
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
      // Use modulo to cycle through textures if we have fewer textures than panels
      const textureIndex = i % textureArray.length;

      items.push(
        <mesh
          key={i}
          geometry={curvedGeometry}
          rotation={[0, -angle + Math.PI, 0]} // Position around circle
        >
          <meshBasicMaterial
            map={textureArray[textureIndex]}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }
    return items;
  }, [panelCount, curvedGeometry, textures]);

  return <group ref={groupRef}>{panels}</group>;
}

function SceneContent() {
  return (
    <>
      {/* White fog to fade out back panels */}
      <fog attach="fog" args={['#ffffff', 4.5, 6]} />
      <Suspense fallback={null}>
        <Model />
        <ImageCarousel radius={1.6} baseSpeed={0.15} panelCount={14} />
        <Environment files="/3D/studio_small_09_1k.hdr" />
      </Suspense>
      <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
    </>
  );
}

function Scene() {
  return (
    <GodrayEffect>
      <SceneContent />
    </GodrayEffect>
  );
}

export default function CommunityCanvas() {
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

  // Drag gesture for carousel control
  const bind = useDrag(
    ({movement: [mx], direction: [dx], down}) => {
      const handler = (window as any).__carouselDrag;
      if (handler) {
        handler(mx, down, dx);
      }
    },
    {pointer: {touch: true}}
  );

  return (
    <div
      ref={containerRef}
      {...bind()}
      style={{width: '100%', height: '100%', cursor: 'grab', touchAction: 'none'}}
    >
      <Canvas
        camera={{position: [0, 0, 4], fov: 50}}
        dpr={[1, 2]}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{antialias: true, powerPreference: 'high-performance'}}
      >
        <Scene />
      </Canvas>
    </div>
  );
}