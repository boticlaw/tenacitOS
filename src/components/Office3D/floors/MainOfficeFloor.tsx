"use client";

import { Text } from "@react-three/drei";

interface FloorProps {
  agents?: Array<{
    id: string;
    name: string;
    emoji: string;
    position: [number, number, number];
    color: string;
    role: string;
  }>;
  onAgentClick?: (agentId: string) => void;
}

export function MainOfficeFloor({ agents = [], onAgentClick }: FloorProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {agents.map((agent) => (
        <group key={agent.id} position={agent.position} onClick={() => onAgentClick?.(agent.id)}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.2, 0.8, 0.8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.4]} />
            <meshStandardMaterial color={agent.color} />
          </mesh>
          <Text
            position={[0, 1.3, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {agent.emoji} {agent.name}
          </Text>
        </group>
      ))}

      {[
        { pos: [-8, 0.5, -6], color: "#2d5a27" },
        { pos: [8, 0.5, -6], color: "#2d5a27" },
        { pos: [-8, 0.5, 6], color: "#3d6a37" },
        { pos: [8, 0.5, 6], color: "#3d6a37" },
      ].map((plant, i) => (
        <group key={i} position={plant.pos as [number, number, number]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.25, 0.6, 16]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={plant.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
