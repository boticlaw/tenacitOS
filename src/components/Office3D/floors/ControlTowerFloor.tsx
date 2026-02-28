"use client";

import { Text } from "@react-three/drei";

interface DashboardStat {
  label: string;
  value: string;
  color: string;
}

const DEMO_STATS: DashboardStat[] = [
  { label: "Active Agents", value: "4", color: "#10b981" },
  { label: "Sessions Today", value: "127", color: "#3b82f6" },
  { label: "Tokens Used", value: "2.4M", color: "#8b5cf6" },
  { label: "Cost Today", value: "$12.45", color: "#f59e0b" },
];

export function ControlTowerFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      <group position={[0, 0.5, -5]}>
        <mesh>
          <boxGeometry args={[14, 4, 0.2]} />
          <meshStandardMaterial color="#0d0d1a" metalness={0.9} roughness={0.1} />
        </mesh>

        <mesh position={[0, 0, 0.15]}>
          <planeGeometry args={[13.5, 3.5]} />
          <meshStandardMaterial color="#0a0a15" />
        </mesh>

        {DEMO_STATS.map((stat, i) => {
          const x = -5 + i * 3.5;
          return (
            <group key={i} position={[x, 0.5, 0.2]}>
              <Text
                position={[0, 0.8, 0]}
                fontSize={0.25}
                color={stat.color}
                anchorX="center"
                anchorY="middle"
                font="/fonts/inter-bold.woff"
              >
                {stat.value}
              </Text>
              <Text
                position={[0, 0.3, 0]}
                fontSize={0.12}
                color="#666"
                anchorX="center"
                anchorY="middle"
              >
                {stat.label}
              </Text>
            </group>
          );
        })}

        {[
          { x: -6, color: "#10b981", height: 1.8 },
          { x: -4, color: "#3b82f6", height: 1.5 },
          { x: -2, color: "#8b5cf6", height: 2.2 },
          { x: 0, color: "#f59e0b", height: 1.0 },
          { x: 2, color: "#ef4444", height: 0.6 },
          { x: 4, color: "#06b6d4", height: 1.7 },
          { x: 6, color: "#10b981", height: 2.0 },
        ].map((bar, i) => (
          <mesh key={i} position={[bar.x, -1 + bar.height / 2, 0.2]}>
            <boxGeometry args={[0.4, bar.height, 0.05]} />
            <meshStandardMaterial
              color={bar.color}
              emissive={bar.color}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>

      {[
        { pos: [-6, 0.3, 4], label: "CPU", value: "45%" },
        { pos: [-2, 0.3, 4], label: "Memory", value: "62%" },
        { pos: [2, 0.3, 4], label: "Network", value: "12 MB/s" },
        { pos: [6, 0.3, 4], label: "Disk", value: "340 GB" },
      ].map((console, i) => (
        <group key={i} position={console.pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[2, 0.5, 1]} />
            <meshStandardMaterial color="#2a2a3e" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <planeGeometry args={[1.8, 0.3]} />
            <meshStandardMaterial color="#0a0a15" />
          </mesh>
          <Text
            position={[0, 0.32, 0.1]}
            fontSize={0.08}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            {console.label}: {console.value}
          </Text>
        </group>
      ))}

      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#3b82f6" />
      <pointLight position={[-7, 2, -5]} intensity={0.3} color="#10b981" />
      <pointLight position={[7, 2, -5]} intensity={0.3} color="#8b5cf6" />

      {[
        { x: -8, z: -6 },
        { x: 8, z: -6 },
        { x: -8, z: 6 },
        { x: 8, z: 6 },
      ].map((corner, i) => (
        <group key={i} position={[corner.x, 0, corner.z]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
            <meshStandardMaterial color="#2a2a3e" metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
