import {Canvas, useFrame, useThree, createPortal} from '@react-three/fiber';
import {OrbitControls, useGLTF, useAnimations, Environment, useTexture, useFBO} from '@react-three/drei';
import {Suspense, useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {useDrag} from '@use-gesture/react';
import * as THREE from 'three';
import {useTheme} from '~/contexts/ThemeContext';

function Model() {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const {actions, names} = useAnimations(animations, scene);
  const modelRef = useRef<THREE.Group>(null);
  const {pointer} = useThree();

  // Fixed scale - same size on all screens
  const modelScale = 0.45;

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
        child.material.fog = false; // Disable fog for 3D model
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

  // Subtle mouse interaction (desktop only)
  useFrame(() => {
    if (modelRef.current) {
      // Check if desktop (wider than 768px)
      const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

      if (isDesktop) {
        // Subtle movement following mouse (very small values)
        const targetX = pointer.x * 0.1;
        const targetY = pointer.y * 0.05;

        // Smooth interpolation for natural movement
        modelRef.current.rotation.y += (targetX - modelRef.current.rotation.y + (-Math.PI / 2)) * 0.02;
        modelRef.current.rotation.x += (targetY - modelRef.current.rotation.x) * 0.02;
        modelRef.current.position.x += (targetX - modelRef.current.position.x) * 0.02;
        modelRef.current.position.y += (targetY - modelRef.current.position.y) * 0.02;
      } else {
        // On mobile, keep model centered with base rotation
        modelRef.current.rotation.y += ((-Math.PI / 2) - modelRef.current.rotation.y) * 0.02;
        modelRef.current.rotation.x += (0 - modelRef.current.rotation.x) * 0.02;
        modelRef.current.position.x += (0 - modelRef.current.position.x) * 0.02;
        modelRef.current.position.y += (0 - modelRef.current.position.y) * 0.02;
      }
    }
  });

  return <primitive ref={modelRef} object={scene} scale={modelScale} rotation={[0, -Math.PI / 2, 0]} />;
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
uniform float godrayIntensity;
uniform float brightness;
uniform float contrast;
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
  vec4 finalColor = mix(original, 1. - (1. - color)*(1. - original), godrayIntensity);

  // Brightness en contrast
  finalColor.rgb *= brightness;
  finalColor.rgb = pow(finalColor.rgb, vec3(contrast));

  gl_FragColor = finalColor;
}
`;

// Godray Post-Processing Effect
function GodrayEffect({children}: {children: React.ReactNode}) {
  const {gl, scene, camera, size} = useThree();
  const {theme} = useTheme();

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
        godrayIntensity: {value: theme === 'dark' ? 0.05 : 0.08},
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
  const {pointer} = useThree();

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
    timeScaleRef.current += (targetTimeScaleRef.current - timeScaleRef.current) * 0.05;

    // Apply rotation
    groupRef.current.rotation.y += delta * baseSpeed * timeScaleRef.current;

    // Check if desktop (wider than 768px)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;

    if (isDesktop) {
      // Subtle tilt based on mouse position
      const targetTiltX = pointer.y * 0.03; // Up/down mouse movement
      const targetTiltZ = pointer.x * 0.05; // Left/right mouse movement

      // Smooth interpolation for natural tilting
      groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * 0.02;
    } else {
      // On mobile, reset tilt to neutral
      groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.02;
    }
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
    const arcAngle = (Math.PI * 2) / panelCount * 0.92; // Arc per panel (smaller gap)
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
          <meshStandardMaterial
            emissiveMap={textureArray[textureIndex]}
            emissive={new THREE.Color(1.0, 1.0, 1.0)}
            color={new THREE.Color(0, 0, 0)}
            side={THREE.DoubleSide}
            toneMapped={false}
            roughness={1}
            metalness={0}
          />
        </mesh>
      );
    }
    return items;
  }, [panelCount, curvedGeometry, textures]);

  return <group ref={groupRef}>{panels}</group>;
}


function SceneContent({hdriRotation}: {hdriRotation: [number, number, number]}) {
  const {theme} = useTheme();
  const {scene} = useThree();
  const fogColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';

  // Set scene background to null for transparency
  useEffect(() => {
    scene.background = null;
  }, [scene]);

  // Fixed carousel radius - same size on all screens
  const getCarouselRadius = () => {
    return 1.6;
  };

  // Fog - based on camera and carousel positions
  // Model has fog=false so it's not affected
  const getFogParams = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const carouselRadius = 1.6;

    if (isMobile) {
      // Mobile camera at Z=3
      // Front photos distance: 3 - 1.6 = 1.4
      // Back photos distance: 3 + 1.6 = 4.6
      // Fog starts after front, ends before back
      return [1.8, 3.2];
    }

    // Desktop camera at Z=4
    const cameraZ = 4;
    const fogNear = cameraZ - carouselRadius * 0.8;
    const fogFar = cameraZ - carouselRadius * 0.1;

    return [fogNear, fogFar];
  };

  const fogParams = getFogParams();

  // Check if mobile - only show carousel on mobile, no 3D model
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      <fog attach="fog" args={[fogColor, fogParams[0], fogParams[1]]} />
      <Suspense fallback={null}>
        {!isMobile && <Model />}
        <ImageCarousel radius={getCarouselRadius()} baseSpeed={0.15} panelCount={14} />
        <Environment
          files="/3D/studio_small_09_1k.hdr"
          environmentRotation={hdriRotation}
        />
      </Suspense>
      <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
    </>
  );
}

function Scene({hdriRotation}: {hdriRotation: [number, number, number]}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // No godray on mobile for better performance
  if (isMobile) {
    return <SceneContent hdriRotation={hdriRotation} />;
  }

  return (
    <GodrayEffect>
      <SceneContent hdriRotation={hdriRotation} />
    </GodrayEffect>
  );
}

export default function CommunityCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Camera position - closer on mobile for zoomed in photos
  const getCameraPosition = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      // Mobile: Z=3 for balanced photo size, Desktop: Z=4
      const z = isMobile ? 3 : 4;
      return [0, 0, z];
    }
    return [0, 0, 4]; // Desktop - default
  };
  
  const [cameraPosition, setCameraPosition] = useState(getCameraPosition);

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
  

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // Drag gesture for carousel control - disabled on mobile for smooth scrolling
  const bind = useDrag(
    ({movement: [mx], direction: [dx], down}) => {
      if (isMobile) return; // Disable on mobile
      const handler = (window as any).__carouselDrag;
      if (handler) {
        handler(mx, down, dx);
      }
    },
    {
      enabled: !isMobile, // Completely disable gesture on mobile
      pointer: {touch: true},
    }
  );

  return (
    <div
      ref={containerRef}
      {...(isMobile ? {} : bind())}
      style={{
        width: '100%',
        height: '100%',
        cursor: isMobile ? 'default' : 'grab',
        touchAction: isMobile ? 'auto' : undefined,
        pointerEvents: isMobile ? 'none' : 'auto',
      }}
    >
      <Canvas
        camera={{position: cameraPosition, fov: 50}}
        dpr={Math.min(window.devicePixelRatio || 2, 3)}
        frameloop={isVisible ? 'always' : 'never'}
        style={{pointerEvents: isMobile ? 'none' : 'auto'}}
        gl={{antialias: true, powerPreference: 'high-performance'}}
      >
        <Scene hdriRotation={[46 * Math.PI / 180, 0 * Math.PI / 180, 0 * Math.PI / 180]} />
      </Canvas>
    </div>
  );
}