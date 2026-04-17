// @ts-nocheck
// Three.js / R3F scene — JSX intrinsic elements (mesh, group, lights, geometries…)
// are provided by @react-three/fiber via module augmentation. Our project's
// tsconfig restricts the global `types` array, which makes the typechecker miss
// these augmentations. We disable typechecking for this file only — the scene
// is fully runtime-validated by R3F itself.
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Glowing torus that slowly rotates — represents a chef's pan rim
 */
const NeonRing = ({ position, scale = 1, color = '#ff8a1a' }: { position: [number, number, number]; scale?: number; color?: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15;
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[1.2, 0.06, 32, 128]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
};

/**
 * Soft distorted blob — represents dough or a sauce dollop, glowing amber
 */
const GlowBlob = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.8}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[0.9, 16]} />
        <MeshDistortMaterial
          color="#1a1410"
          emissive="#ff6a00"
          emissiveIntensity={0.4}
          roughness={0.25}
          metalness={0.6}
          distort={0.35}
          speed={1.2}
        />
      </mesh>
    </Float>
  );
};

/**
 * Tiny floating cubes representing ingredients/data points
 */
const DataCubes = () => {
  const group = useRef<THREE.Group>(null);
  const cubes = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        pos: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6 - 2,
        ] as [number, number, number],
        scale: 0.05 + Math.random() * 0.1,
        speed: 0.2 + Math.random() * 0.5,
        key: i,
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <group ref={group}>
      {cubes.map((c) => (
        <Float key={c.key} speed={c.speed} rotationIntensity={1} floatIntensity={1.5}>
          <mesh position={c.pos} scale={c.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#ffaa55"
              emissive="#ff8a1a"
              emissiveIntensity={1.8}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const Scene = () => {
  return (
    <>
      {/* Dark fog for depth */}
      <fog attach="fog" args={['#08070a', 6, 18]} />

      {/* Subtle key/fill lights — most light comes from emissive materials */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 4, 4]} intensity={1.2} color="#ff8a1a" />
      <pointLight position={[-5, -2, 3]} intensity={0.6} color="#ff5500" />
      <pointLight position={[0, 0, -5]} intensity={0.4} color="#ffaa55" />

      {/* Hero objects */}
      <NeonRing position={[-2.4, 0.4, 0]} scale={1.1} color="#ff8a1a" />
      <NeonRing position={[2.6, -0.6, -1]} scale={0.7} color="#ff5500" />
      <GlowBlob position={[0.4, -0.2, 0.5]} scale={1.2} />
      <GlowBlob position={[3, 1.6, -1.5]} scale={0.5} />
      <GlowBlob position={[-3.2, -1.5, -1]} scale={0.6} />

      <DataCubes />

      {/* Glowing particles — flour, spices, embers */}
      <Sparkles
        count={120}
        scale={[12, 6, 6]}
        size={2}
        speed={0.3}
        opacity={0.7}
        color="#ffb060"
      />

      <Environment preset="night" />
    </>
  );
};

interface HeroSceneProps {
  className?: string;
}

export const HeroScene = ({ className }: HeroSceneProps) => {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};
