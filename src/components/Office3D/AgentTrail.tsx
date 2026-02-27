'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface AgentTrailProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

export default function AgentTrail({ start, end, color = '#3b82f6' }: AgentTrailProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  // Create curved path
  const curve = useMemo(() => {
    const startPos = new THREE.Vector3(...start);
    const endPos = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3(
      (start[0] + end[0]) / 2,
      Math.max(start[1], end[1]) + 0.5,
      (start[2] + end[2]) / 2
    );
    
    return new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
  }, [start, end]);
  
  // Line points for drei Line component
  const linePoints = useMemo(() => {
    return curve.getPoints(20).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [curve]);
  
  // Particle positions
  const particleCount = 10;
  const particlePositions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, []);
  
  // Animate particles along the curve
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const t = ((time * 0.3 + i / particleCount) % 1);
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Line using drei Line component */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={1}
        dashed
        dashScale={2}
        dashSize={0.1}
        gapSize={0.05}
        transparent
        opacity={0.6}
      />
      
      {/* Animated particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.05}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
