import React, { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── Reactive Orb ────────────────────────────── */
function ReactiveOrb({ position, color, speed, distort, scale, floatSpeed, floatIntensity }) {
  const meshRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  // Track mouse
  const handlePointerMove = useCallback((e) => {
    mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  React.useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Mouse reactivity - orbs gently drift toward mouse
    const targetX = position[0] + mousePos.current.x * 0.8;
    const targetY = position[1] + mousePos.current.y * 0.5;

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x, targetX, delta * 1.2
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y, targetY, delta * 1.2
    );

    // Gentle rotation
    meshRef.current.rotation.x += delta * speed * 0.3;
    meshRef.current.rotation.y += delta * speed * 0.2;
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;

    // Pulse scale
    const pulse = 1 + Math.sin(time * speed * 1.5) * 0.05;
    meshRef.current.scale.setScalar(scale * pulse);
  });

  return (
    <Float speed={floatSpeed} rotationIntensity={0.4} floatIntensity={floatIntensity}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          distort={distort}
          speed={speed * 2}
          transparent
          opacity={0.85}
          envMapIntensity={1.2}
        />
      </Sphere>
    </Float>
  );
}

/* ─── Tiny Floating Particles ──────────────────── */
function FloatingParticles({ count = 80 }) {
  const meshRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    return { positions, sizes };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const posArr = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.002;
      posArr[i * 3] += Math.cos(time * 0.3 + i * 0.5) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FF8C40"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Glowing Ring ─────────────────────────────── */
function GlowRing({ position, color, scale = 1, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = Math.sin(t * speed * 0.5) * 0.3 + Math.PI * 0.25;
    meshRef.current.rotation.y += 0.003 * speed;
    meshRef.current.rotation.z = Math.cos(t * speed * 0.3) * 0.2;
    const pulse = 1 + Math.sin(t * speed * 2) * 0.08;
    meshRef.current.scale.setScalar(scale * pulse);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[1, 0.02, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

/* ─── Scene Content ────────────────────────────── */
function Scene() {
  return (
    <>
      {/* Ambient + directional light for material rendering */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#FFD4B0" />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} color="#FF6B00" />
      <pointLight position={[0, 0, 3]} intensity={1.5} color="#FF8C40" distance={12} />

      {/* Main large orb - center-right */}
      <ReactiveOrb
        position={[2.2, 0.3, -1]}
        color="#FF6B00"
        speed={1.2}
        distort={0.45}
        scale={1.6}
        floatSpeed={1.5}
        floatIntensity={1.2}
      />

      {/* Secondary orb - upper left */}
      <ReactiveOrb
        position={[-2.5, 1.8, -2]}
        color="#FF8C40"
        speed={0.8}
        distort={0.35}
        scale={0.9}
        floatSpeed={2}
        floatIntensity={1.5}
      />

      {/* Third orb - lower right */}
      <ReactiveOrb
        position={[3.5, -1.5, -1.5]}
        color="#D64F00"
        speed={1.5}
        distort={0.5}
        scale={0.7}
        floatSpeed={1.8}
        floatIntensity={1}
      />

      {/* Fourth small orb - top right */}
      <ReactiveOrb
        position={[1, 2.5, -0.5]}
        color="#FFAE73"
        speed={2}
        distort={0.3}
        scale={0.45}
        floatSpeed={2.5}
        floatIntensity={2}
      />

      {/* Fifth orb - far left bottom */}
      <ReactiveOrb
        position={[-3.5, -1.2, -3]}
        color="#FF5500"
        speed={0.6}
        distort={0.4}
        scale={1.1}
        floatSpeed={1.2}
        floatIntensity={0.8}
      />

      {/* Decorative glowing rings */}
      <GlowRing position={[2, 0.5, -1.5]} color="#FF6B00" scale={2} speed={0.8} />
      <GlowRing position={[-2, 1, -2.5]} color="#FFAE73" scale={1.2} speed={1.2} />
      <GlowRing position={[3, -1, -2]} color="#D64F00" scale={0.8} speed={1.5} />

      {/* Floating particles */}
      <FloatingParticles count={100} />

      {/* Post-processing glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/* ─── Main Canvas Export ───────────────────────── */
export default function HeroCanvas() {
  return (
    <div className="hero-canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
