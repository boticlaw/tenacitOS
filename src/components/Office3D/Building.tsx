"use client";

import { useMemo } from "react";
import { MainOfficeFloor } from "./floors/MainOfficeFloor";
import { ServerRoomFloor } from "./floors/ServerRoomFloor";
import { ArchiveFloor } from "./floors/ArchiveFloor";
import { ControlTowerFloor } from "./floors/ControlTowerFloor";

export type FloorType = "main" | "server" | "archive" | "tower";

interface BuildingProps {
  currentFloor: FloorType;
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

const FLOOR_HEIGHT = 5;

const FLOOR_CONFIG: Record<FloorType, { name: string; emoji: string; color: string }> = {
  main: { name: "Main Office", emoji: "🏢", color: "#3b82f6" },
  server: { name: "Server Room", emoji: "🖥️", color: "#10b981" },
  archive: { name: "Archive", emoji: "📚", color: "#f59e0b" },
  tower: { name: "Control Tower", emoji: "📡", color: "#8b5cf6" },
};

export function Building({ currentFloor, agents, onAgentClick }: BuildingProps) {
  const floorY = useMemo(() => {
    const floorIndex: Record<FloorType, number> = {
      main: 0,
      server: 1,
      archive: 2,
      tower: 3,
    };
    return floorIndex[currentFloor] * FLOOR_HEIGHT;
  }, [currentFloor]);

  return (
    <group position={[0, -floorY, 0]}>
      <group position={[0, 0, 0]}>
        <MainOfficeFloor agents={agents} onAgentClick={onAgentClick} />
      </group>

      <group position={[0, FLOOR_HEIGHT, 0]}>
        <ServerRoomFloor />
      </group>

      <group position={[0, FLOOR_HEIGHT * 2, 0]}>
        <ArchiveFloor />
      </group>

      <group position={[0, FLOOR_HEIGHT * 3, 0]}>
        <ControlTowerFloor />
      </group>

      <group position={[9, 0, 0]}>
        {[0, 1, 2, 3].map((floor) => (
          <mesh key={floor} position={[0, floor * FLOOR_HEIGHT + 2, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial
              color={floor === ["main", "server", "archive", "tower"].indexOf(currentFloor) ? "#3b82f6" : "#333"}
              emissive={floor === ["main", "server", "archive", "tower"].indexOf(currentFloor) ? "#3b82f6" : "#000"}
              emissiveIntensity={floor === ["main", "server", "archive", "tower"].indexOf(currentFloor) ? 0.5 : 0}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.4, FLOOR_HEIGHT * 4 - 1, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export { FLOOR_CONFIG };
