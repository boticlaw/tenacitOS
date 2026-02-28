"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";

interface ServerRack {
  id: string;
  name: string;
  status: "online" | "warning" | "offline";
  type: "database" | "api" | "service" | "integration";
  metrics?: {
    cpu?: number;
    memory?: number;
    requests?: number;
  };
}

const DEMO_SERVERS: ServerRack[] = [
  { id: "db-main", name: "PostgreSQL", status: "online", type: "database", metrics: { cpu: 45, memory: 62 } },
  { id: "db-redis", name: "Redis", status: "online", type: "database", metrics: { cpu: 12, memory: 34 } },
  { id: "api-main", name: "API Server", status: "online", type: "api", metrics: { cpu: 78, memory: 45 } },
  { id: "svc-queue", name: "Queue Worker", status: "warning", type: "service", metrics: { cpu: 95, memory: 88 } },
  { id: "int-telegram", name: "Telegram Bot", status: "online", type: "integration" },
  { id: "int-openai", name: "OpenAI API", status: "online", type: "integration" },
];

const STATUS_COLORS = {
  online: "#10b981",
  warning: "#f59e0b",
  offline: "#ef4444",
};

const TYPE_COLORS = {
  database: "#3b82f6",
  api: "#8b5cf6",
  service: "#ec4899",
  integration: "#06b6d4",
};

export function ServerRoomFloor() {
  const rackPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push([-5 + col * 5, 0, -4 + row * 8]);
      }
    }
    return positions;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {DEMO_SERVERS.map((server, index) => {
        const pos = rackPositions[index];
        const statusColor = STATUS_COLORS[server.status];
        const typeColor = TYPE_COLORS[server.type];

        return (
          <group
            key={server.id}
            position={pos}
          >
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[1.8, 3, 1]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>

            {[0.3, 0.7, 1.1, 1.5, 1.9, 2.3, 2.7].map((y, i) => (
              <mesh key={i} position={[0.7, y, 0.51]}>
                <boxGeometry args={[0.1, 0.15, 0.1]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? statusColor : "#333"}
                  emissive={i % 2 === 0 ? statusColor : "#000"}
                  emissiveIntensity={i % 2 === 0 ? 0.5 : 0}
                />
              </mesh>
            ))}

            <mesh position={[0, 3.2, 0]}>
              <boxGeometry args={[1.6, 0.1, 0.8]} />
              <meshStandardMaterial color={typeColor} metalness={0.9} />
            </mesh>

            <Text
              position={[0, 0.1, 0.51]}
              fontSize={0.12}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {server.name}
            </Text>
          </group>
        );
      })}

      {[
        { start: [-9, 3, -7], end: [-9, 3, 7] },
        { start: [9, 3, -7], end: [9, 3, 7] },
        { start: [-9, 3, 7], end: [9, 3, 7] },
      ].map((cable, i) => {
        const length = Math.sqrt(
          Math.pow(cable.end[0] - cable.start[0], 2) +
          Math.pow(cable.end[1] - cable.start[1], 2) +
          Math.pow(cable.end[2] - cable.start[2], 2)
        );
        const centerX = (cable.start[0] + cable.end[0]) / 2;
        const centerY = (cable.start[1] + cable.end[1]) / 2;
        const centerZ = (cable.start[2] + cable.end[2]) / 2;
        
        return (
          <mesh key={i} position={[centerX, centerY, centerZ]}>
            <boxGeometry args={[0.1, 0.1, length]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
      })}

      <pointLight position={[0, 3.5, 0]} intensity={0.3} color="#00ff88" />
      <pointLight position={[-7, 3.5, -5]} intensity={0.2} color="#0088ff" />
      <pointLight position={[7, 3.5, 5]} intensity={0.2} color="#ff8800" />
    </group>
  );
}
