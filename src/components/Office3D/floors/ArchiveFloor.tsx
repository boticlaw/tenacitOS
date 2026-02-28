"use client";

import { Text } from "@react-three/drei";

interface ArchiveShelf {
  id: string;
  period: string;
  label: string;
  itemCount: number;
  color: string;
}

const ARCHIVE_SHELVES: ArchiveShelf[] = [
  { id: "2026-q1", period: "2026 Q1", label: "Recent", itemCount: 245, color: "#4a5568" },
  { id: "2025-q4", period: "2025 Q4", label: "Last Quarter", itemCount: 1892, color: "#4a5568" },
  { id: "2025-q3", period: "2025 Q3", label: "Q3 2025", itemCount: 1654, color: "#3d4654" },
  { id: "2025-q2", period: "2025 Q2", label: "Q2 2025", itemCount: 1432, color: "#3d4654" },
  { id: "2025-q1", period: "2025 Q1", label: "Q1 2025", itemCount: 1287, color: "#2d3748" },
  { id: "2024", period: "2024", label: "Archive 2024", itemCount: 4521, color: "#2d3748" },
  { id: "2023", period: "2023", label: "Archive 2023", itemCount: 3876, color: "#1a202c" },
  { id: "older", period: "Older", label: "Legacy", itemCount: 8234, color: "#1a202c" },
];

export function ArchiveFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a1510" />
      </mesh>

      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshStandardMaterial color="#0d0a08" />
      </mesh>

      {[
        { x: -7, z: -6, rotY: 0 },
        { x: 0, z: -6, rotY: 0 },
        { x: 7, z: -6, rotY: 0 },
        { x: -7, z: 0, rotY: 0 },
        { x: 0, z: 0, rotY: 0 },
        { x: 7, z: 0, rotY: 0 },
        { x: -7, z: 6, rotY: 0 },
        { x: 7, z: 6, rotY: 0 },
      ].map((pos, index) => {
        const shelf = ARCHIVE_SHELVES[index];
        if (!shelf) return null;

        return (
          <group key={shelf.id} position={[pos.x, 0, pos.z]} rotation={[0, pos.rotY, 0]}>
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[4, 3, 0.8]} />
              <meshStandardMaterial color={shelf.color} />
            </mesh>

            {[0.5, 1.2, 1.9, 2.6].map((y, i) => (
              <mesh key={i} position={[0, y, 0.45]}>
                <boxGeometry args={[3.6, 0.4, 0.1]} />
                <meshStandardMaterial color="#5a4a3a" />
              </mesh>
            ))}

            {[...Array(Math.min(shelf.itemCount, 20))].map((_, i) => (
              <mesh
                key={i}
                position={[
                  -1.5 + (i % 5) * 0.7,
                  0.7 + Math.floor(i / 5) * 0.7,
                  0.5,
                ]}
              >
                <boxGeometry args={[0.5, 0.5, 0.1]} />
                <meshStandardMaterial color={`hsl(30, 20%, ${30 + (i % 3) * 10}%)`} />
              </mesh>
            ))}

            <Text
              position={[0, 3.3, 0.5]}
              fontSize={0.15}
              color="#a08060"
              anchorX="center"
              anchorY="middle"
            >
              {shelf.period}
            </Text>
            <Text
              position={[0, -0.2, 0.5]}
              fontSize={0.1}
              color="#6a5a4a"
              anchorX="center"
              anchorY="middle"
            >
              {shelf.itemCount} items
            </Text>
          </group>
        );
      })}

      <ambientLight intensity={0.1} />
      {[
        { pos: [-8, 3, -7], color: "#ffaa44" },
        { pos: [8, 3, -7], color: "#ffaa44" },
        { pos: [-8, 3, 7], color: "#ff8833" },
        { pos: [8, 3, 7], color: "#ff8833" },
      ].map((light, i) => (
        <pointLight
          key={i}
          position={light.pos as [number, number, number]}
          intensity={0.15}
          color={light.color}
          distance={8}
        />
      ))}
    </group>
  );
}
