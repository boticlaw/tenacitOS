'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface VisitorAvatarProps {
  id: string;
  task: string;
  model: string;
  tokens: number;
  status: 'active' | 'idle';
  parentPosition: [number, number, number];
  index: number;
  onClick?: () => void;
}

const VISITOR_COLORS = [
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#34d399', // green
  '#fbbf24', // amber
  '#f472b6', // pink
];

export default function VisitorAvatar({
  id,
  task,
  model,
  tokens,
  status,
  parentPosition,
  index,
  onClick,
}: VisitorAvatarProps) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Calculate position around parent
  const angle = (index / 5) * Math.PI * 2;
  const radius = 1.5;
  const targetPosition = useMemo(() => new THREE.Vector3(
    parentPosition[0] + Math.cos(angle) * radius,
    0.8,
    parentPosition[2] + Math.sin(angle) * radius
  ), [parentPosition, angle]);
  
  const color = VISITOR_COLORS[index % VISITOR_COLORS.length];
  
  // Animate rotation and floating
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Float up and down
    meshRef.current.position.y = targetPosition.y + Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
    
    // Pulse ring for active visitors
    if (ringRef.current && status === 'active') {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group ref={meshRef} position={targetPosition} onClick={onClick}>
      {/* Visitor body - small robot shape */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.06, 0.32, 0.13]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={status === 'active' ? '#22c55e' : '#666666'} emissive={status === 'active' ? '#22c55e' : '#000000'} emissiveIntensity={status === 'active' ? 0.5 : 0} />
      </mesh>
      <mesh position={[0.06, 0.32, 0.13]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={status === 'active' ? '#22c55e' : '#666666'} emissive={status === 'active' ? '#22c55e' : '#000000'} emissiveIntensity={status === 'active' ? 0.5 : 0} />
      </mesh>
      
      {/* Status ring */}
      <mesh ref={ringRef} position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 16]} />
        <meshBasicMaterial color={status === 'active' ? '#22c55e' : '#666666'} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Token count label */}
      <Html
        position={[0, 0.6, 0]}
        center
        style={{
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {tokens > 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens} tok
        </div>
      </Html>
    </group>
  );
}
