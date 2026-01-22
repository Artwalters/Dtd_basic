import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useGLTF, useAnimations, Environment, useTexture, useFBO} from '@react-three/drei';
import {Suspense, useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {useDrag} from '@use-gesture/react';
import * as THREE from 'three';
import {useTheme} from '~/contexts/ThemeContext';

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

function Model({isTouchDevice}: {isTouchDevice: boolean}) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const {actions, names} = useAnimations(animations, scene);
  const modelRef = useRef<THREE.Group>(null);
  const {pointer} = useThree();

  // Simple metallic material without textures (lighter weight)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.2, 0.2, 0.2),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 0.8,
    });
  }, []);

  // Apply material to all meshes in the scene
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.material.fog = false;
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

  // Subtle mouse interaction (desktop only - no hover on touch devices)
  useFrame(() => {
    if (modelRef.current) {
      if (isTouchDevice) {
        // On touch devices, just maintain base rotation without hover effects
        modelRef.current.rotation.y += ((-Math.PI / 2) - modelRef.current.rotation.y) * 0.02;
        modelRef.current.rotation.x += (0 - modelRef.current.rotation.x) * 0.02;
        modelRef.current.position.x += (0 - modelRef.current.position.x) * 0.02;
        modelRef.current.position.y += (0 - modelRef.current.position.y) * 0.02;
      } else {
        const targetX = pointer.x * 0.1;
        const targetY = pointer.y * 0.05;

        // Smooth interpolation for natural movement
        modelRef.current.rotation.y += (targetX - modelRef.current.rotation.y + (-Math.PI / 2)) * 0.02;
        modelRef.current.rotation.x += (targetY - modelRef.current.rotation.x) * 0.02;
        modelRef.current.position.x += (targetX - modelRef.current.position.x) * 0.02;
        modelRef.current.position.y += (targetY - modelRef.current.position.y) * 0.02;
      }
    }
  });

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return <primitive ref={modelRef} object={scene} scale={isTouchDevice ? 0.40 : 0.45} rotation={[0, -Math.PI / 2, 0]} />;
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
uniform sampler2D uMap;
uniform float godrayIntensity;
uniform float brightness;
uniform float contrast;
varying vec2 vUv;

float PI = 3.141592653589793238;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// Convert linear to sRGB
vec3 linearToSRGB(vec3 color) {
  return pow(color, vec3(1.0 / 2.2));
}

void main() {
  vec2 toCenter = vec2(0.5) - vUv;
  vec4 original = texture2D(uMap, vUv);

  vec4 color = vec4(0.0);
  float total = 0.0;

  // Radial blur sampling voor godray effect (reduced samples for performance)
  for(float i = 0.0; i < 5.0; i++) {
    float lerp = (i + rand(vec2(gl_FragCoord.x, gl_FragCoord.y))) / 5.0;
    float weight = sin(lerp * PI);
    vec4 mysample = texture2D(uMap, vUv + toCenter * lerp * 0.95);
    color += mysample * weight;
    total += weight;
  }

  color.a = 1.0;
  color /= total;

  // Godray blending
  vec4 finalColor = mix(original, 1. - (1. - color)*(1. - original), godrayIntensity);

  // Brightness en contrast
  finalColor.rgb *= brightness;
  finalColor.rgb = pow(finalColor.rgb, vec3(contrast));

  // Apply gamma correction for correct colors
  gl_FragColor = vec4(linearToSRGB(finalColor.rgb), finalColor.a);
}
`;

// Godray Post-Processing Effect
function GodrayEffect({children, isTouchDevice}: {children: React.ReactNode; isTouchDevice: boolean}) {
  const {gl, scene, camera, size, viewport} = useThree();
  const {theme} = useTheme();

  // Get actual drawing buffer size (includes DPR for sharp rendering on mobile)
  const drawingBufferSize = useMemo(() => {
    const target = new THREE.Vector2();
    gl.getDrawingBufferSize(target);
    return target;
  }, [gl, size]); // Recalculate when size changes

  // Create render target with correct color space
  // Use actual pixel dimensions for sharp rendering on all devices
  // Lower samples for better performance
  const renderTarget = useFBO(drawingBufferSize.x, drawingBufferSize.y, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    colorSpace: THREE.SRGBColorSpace,
    samples: isTouchDevice ? 2 : 4,
  });

  // Post-processing scene and camera
  const postScene = useMemo(() => new THREE.Scene(), []);
  const postCamera = useMemo(() => new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000), []);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: {value: null},
        godrayIntensity: {value: theme === 'dark' ? 0.012 : 0.018},
        brightness: {value: theme === 'dark' ? 0.95 : 1.0},
        contrast: {value: theme === 'dark' ? 0.99 : 0.98},
      },
      vertexShader: godrayVertexShader,
      fragmentShader: godrayFragmentShader,
    });
  }, [theme]);

  // Fullscreen quad
  const quad = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    postScene.add(mesh);
    return mesh;
  }, [material, postScene]);

  // Render loop with post-processing
  useFrame(() => {
    // First pass: render scene to render target
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);

    // Update uniforms
    material.uniforms.uMap.value = renderTarget.texture;

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
function ImageCarousel({radius = 2.2, baseSpeed = 0.3, panelCount = 10, isTouchDevice}: {
  radius?: number;
  baseSpeed?: number;
  panelCount?: number;
  isTouchDevice: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeScaleRef = useRef(1);
  const targetTimeScaleRef = useRef(1);
  const {pointer} = useThree();

  // Drag sensitivity - higher on mobile for more responsive feel
  const dragSensitivity = isTouchDevice ? 0.08 : 0.03;
  const inertiaSmoothness = isTouchDevice ? 0.1 : 0.05;

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

  // Set correct color space for realistic colors
  useEffect(() => {
    textures.forEach(texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = true;
      texture.needsUpdate = true;
    });
  }, [textures]);

  // Auto-rotate with smooth inertia + subtle mouse tilt (desktop only)
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Lerp timeScale toward target for smooth inertia
    timeScaleRef.current += (targetTimeScaleRef.current - timeScaleRef.current) * inertiaSmoothness;

    // Apply rotation
    groupRef.current.rotation.y += delta * baseSpeed * timeScaleRef.current;

    // Subtle tilt based on mouse position (desktop only - no hover on touch devices)
    if (isTouchDevice) {
      // On touch devices, smoothly return to neutral tilt
      groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.02;
    } else {
      const targetTiltX = pointer.y * 0.03;
      const targetTiltZ = pointer.x * 0.05;

      // Smooth interpolation for natural tilting
      groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * 0.02;
    }
  });

  // Drag handler - smooth direct control, direction persists on release
  const handleDrag = useCallback((deltaX: number, isDragging: boolean, directionX: number) => {
    if (isDragging) {
      // Direct control while dragging - movement controls speed and direction
      timeScaleRef.current = deltaX * dragSensitivity;
      // Track direction for release
      if (Math.abs(deltaX) > 5) {
        targetTimeScaleRef.current = deltaX > 0 ? 1 : -1;
      }
    } else {
      // On release: continue in the direction you were dragging
      // targetTimeScaleRef is already set from dragging
    }
  }, [dragSensitivity]);

  // Expose handler to parent
  useEffect(() => {
    (window as any).__carouselDrag = handleDrag;
    return () => {
      delete (window as any).__carouselDrag;
    };
  }, [handleDrag]);

  // Create curved geometry for panels
  const curvedGeometry = useMemo(() => {
    const arcAngle = (Math.PI * 2) / panelCount * 0.92; // Arc per panel (smaller gap)
    const segments = 16; // Smoothness of curve

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
            toneMapped={false}
          />
        </mesh>
      );
    }
    return items;
  }, [panelCount, curvedGeometry, textures]);

  // Cleanup geometry and textures on unmount
  useEffect(() => {
    return () => {
      curvedGeometry.dispose();
      textures.forEach(texture => texture.dispose());
    };
  }, [curvedGeometry, textures]);

  return <group ref={groupRef}>{panels}</group>;
}


function SceneContent({hdriRotation, isTouchDevice}: {hdriRotation: [number, number, number]; isTouchDevice: boolean}) {
  const {scene} = useThree();
  const fogColor = '#000000';

  useEffect(() => {
    scene.background = new THREE.Color('#000000');
  }, [scene]);

  // Fog params for desktop
  const cameraZ = 4;
  const carouselRadius = 1.6;
  const fogNear = cameraZ - carouselRadius * 0.8;
  const fogFar = cameraZ - carouselRadius * 0.1;

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <Suspense fallback={null}>
        <Model isTouchDevice={isTouchDevice} />
        <ImageCarousel radius={isTouchDevice ? 1.35 : 1.44} baseSpeed={0.15} panelCount={isTouchDevice ? 10 : 13} isTouchDevice={isTouchDevice} />
        <Environment
          files="/3D/studio_small_09_1k.hdr"
          environmentRotation={hdriRotation}
        />
      </Suspense>
    </>
  );
}

function Scene({hdriRotation, isTouchDevice}: {hdriRotation: [number, number, number]; isTouchDevice: boolean}) {
  return (
    <GodrayEffect isTouchDevice={isTouchDevice}>
      <SceneContent hdriRotation={hdriRotation} isTouchDevice={isTouchDevice} />
    </GodrayEffect>
  );
}

export default function CommunityCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const isTouchDevice = useIsTouchDevice();

  useEffect(() => {
    // Set DPR on client side - lower for better performance
    const deviceDpr = window.devicePixelRatio || 2;
    // Cap DPR at 1.5 for better performance (was 2)
    setDpr(Math.min(deviceDpr, 1.5));
  }, [isTouchDevice]);

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

  // Drag gesture for carousel control (horizontal only, allows vertical scroll)
  const bind = useDrag(
    ({movement: [mx], direction: [dx], down}) => {
      const handler = (window as any).__carouselDrag;
      if (handler) {
        handler(mx, down, dx);
      }
    },
    {
      pointer: {touch: true},
      axis: 'x',
      filterTaps: true,
    }
  );

  return (
    <div
      ref={containerRef}
      {...bind()}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'pan-y',
      }}
    >
      <Canvas
        camera={{position: [0, 0, 4], fov: 50}}
        dpr={dpr}
        frameloop={isVisible ? 'always' : 'never'}
        gl={{antialias: true, powerPreference: 'high-performance'}}
      >
        <Scene hdriRotation={[75 * Math.PI / 180, 0 * Math.PI / 180, 0 * Math.PI / 180]} isTouchDevice={isTouchDevice} />
      </Canvas>
    </div>
  );
}
