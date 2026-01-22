import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useGLTF, useAnimations, Environment, useFBO} from '@react-three/drei';
import {Suspense, useEffect, useRef, useMemo, useState} from 'react';
import * as THREE from 'three';

// Hook to check if device is touch-only
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
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

  // Radial blur sampling voor godray effect
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
  const {gl, scene, camera, size} = useThree();

  // Get actual drawing buffer size
  const drawingBufferSize = useMemo(() => {
    const target = new THREE.Vector2();
    gl.getDrawingBufferSize(target);
    return target;
  }, [gl, size]);

  // Create render target
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

  // Shader material (always dark theme for error page)
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: {value: null},
        godrayIntensity: {value: 0.012},
        brightness: {value: 0.95},
        contrast: {value: 0.99},
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
  useFrame(() => {
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);
    material.uniforms.uMap.value = renderTarget.texture;
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

function Model({isTouchDevice}: {isTouchDevice: boolean}) {
  const {scene, animations} = useGLTF('/3D/dtd_logo7.glb', '/draco/');
  const {actions, names} = useAnimations(animations, scene);
  const modelRef = useRef<THREE.Group>(null);
  const {pointer} = useThree();

  // Metallic material (same as community section)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.2, 0.2, 0.2),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 0.8,
    });
  }, []);

  // Apply material to all meshes
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

  // Subtle mouse interaction (same as community section)
  useFrame(() => {
    if (modelRef.current) {
      if (isTouchDevice) {
        modelRef.current.rotation.y += ((-Math.PI / 2) - modelRef.current.rotation.y) * 0.02;
        modelRef.current.rotation.x += (0 - modelRef.current.rotation.x) * 0.02;
        modelRef.current.position.x += (0 - modelRef.current.position.x) * 0.02;
        modelRef.current.position.y += (0 - modelRef.current.position.y) * 0.02;
      } else {
        const targetX = pointer.x * 0.1;
        const targetY = pointer.y * 0.05;

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

  // Larger scale on desktop, smaller on mobile
  const scale = isTouchDevice ? 0.28 : 0.52;

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={scale}
      rotation={[0, -Math.PI / 2, 0]}
    />
  );
}

function SceneContent({isTouchDevice}: {isTouchDevice: boolean}) {
  const {scene} = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#000000');
  }, [scene]);

  return (
    <>
      <Suspense fallback={null}>
        <Model isTouchDevice={isTouchDevice} />
        <Environment files="/3D/studio_small_09_1k.hdr" />
      </Suspense>
    </>
  );
}

function Scene({isTouchDevice}: {isTouchDevice: boolean}) {
  return (
    <GodrayEffect isTouchDevice={isTouchDevice}>
      <SceneContent isTouchDevice={isTouchDevice} />
    </GodrayEffect>
  );
}

export default function NotFoundLogo3D() {
  const isTouchDevice = useIsTouchDevice();

  return (
    <div className="not-found-logo-3d">
      <Canvas
        camera={{position: [0, 0, 4], fov: 50}}
        dpr={[1, 2]}
        gl={{antialias: true, powerPreference: 'high-performance'}}
      >
        <Scene isTouchDevice={isTouchDevice} />
      </Canvas>
    </div>
  );
}
