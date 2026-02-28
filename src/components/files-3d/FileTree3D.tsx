"use client";

import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import type { Mesh } from "three";
import type { FileNode3D } from "@/app/api/files/tree-3d/route";

interface FileTree3DProps {
  tree: FileNode3D[];
  onNodeClick?: (node: FileNode3D) => void;
  filter?: {
    types?: string[];
    minSize?: number;
  };
}

function FileNode({
  node,
  position,
  onClick,
}: {
  node: FileNode3D;
  position: [number, number, number];
  onClick?: () => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseSize = node.type === "directory" ? 0.6 : 0.3;
  const sizeScale = Math.log10(Math.max(node.size, 100) / 100) * 0.3;
  const size = Math.max(baseSize, Math.min(baseSize + sizeScale, 1.2));

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {node.type === "directory" ? (
          <boxGeometry args={[size, size, size]} />
        ) : (
          <sphereGeometry args={[size * 0.5, 16, 16]} />
        )}
        <meshStandardMaterial
          color={node.color}
          emissive={hovered ? node.color : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.9)",
              padding: "8px 12px",
              borderRadius: "6px",
              color: "white",
              fontSize: "11px",
              whiteSpace: "nowrap",
              border: `1px solid ${node.color}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>{node.name}</div>
            <div style={{ color: "#888" }}>
              {node.type === "file"
                ? `${(node.size / 1024).toFixed(1)} KB · ${node.extension.toUpperCase()}`
                : `${node.children?.length || 0} items`}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function TreeNode({
  node,
  position,
  onClick,
  filter,
}: {
  node: FileNode3D;
  position: [number, number, number];
  onClick?: (node: FileNode3D) => void;
  filter?: { types?: string[]; minSize?: number };
}) {
  const children = useMemo(() => {
    if (!node.children) return [];

    let filtered = node.children;
    if (filter?.types && filter.types.length > 0) {
      filtered = filtered.filter(
        (c) => c.type === "directory" || filter.types!.includes(c.extension)
      );
    }
    if (filter?.minSize) {
      filtered = filtered.filter(
        (c) => c.type === "directory" || c.size >= filter.minSize!
      );
    }

    return filtered;
  }, [node.children, filter]);

  const childPositions = useMemo(() => {
    const spacing = 2;
    const result: Array<{ pos: [number, number, number]; node: FileNode3D }> = [];

    const angleStep = (2 * Math.PI) / Math.max(children.length, 1);
    const radius = spacing + children.length * 0.3;

    children.forEach((child, i) => {
      const angle = i * angleStep - Math.PI / 2;
      result.push({
        pos: [
          position[0] + Math.cos(angle) * radius,
          position[1] - 2,
          position[2] + Math.sin(angle) * radius,
        ],
        node: child,
      });
    });

    return result;
  }, [children, position]);

  return (
    <group>
      <FileNode node={node} position={position} onClick={() => onClick?.(node)} />

      {childPositions.map((item) => (
        <group key={item.node.id}>
          <Line
            points={[
              [position[0], position[1], position[2]],
              [item.pos[0], item.pos[1], item.pos[2]],
            ]}
            color="#333"
            opacity={0.3}
            transparent
          />

          {item.node.children && item.node.children.length > 0 && item.node.depth < 3 ? (
            <TreeNode
              node={item.node}
              position={item.pos}
              onClick={onClick}
              filter={filter}
            />
          ) : (
            <FileNode
              node={item.node}
              position={item.pos}
              onClick={() => onClick?.(item.node)}
            />
          )}
        </group>
      ))}
    </group>
  );
}

export function FileTree3D({ tree, onNodeClick, filter }: FileTree3DProps) {
  const rootPositions = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; node: FileNode3D }> = [];
    const angleStep = (2 * Math.PI) / Math.max(tree.length, 1);
    const radius = 4;

    tree.forEach((node, i) => {
      const angle = i * angleStep;
      result.push({
        pos: [Math.cos(angle) * radius, 4, Math.sin(angle) * radius],
        node,
      });
    });

    return result;
  }, [tree]);

  return (
    <Canvas camera={{ position: [0, 10, 15], fov: 60 }} style={{ background: "#0a0a0a" }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 20, 10]} intensity={0.8} />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#3178c6" />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />

      <group position={[0, 0, 0]}>
        {rootPositions.map((item) => (
          <TreeNode
            key={item.node.id}
            node={item.node}
            position={item.pos}
            onClick={onNodeClick}
            filter={filter}
          />
        ))}
      </group>

      <gridHelper args={[50, 50, "#222", "#111"]} position={[0, -2, 0]} />
    </Canvas>
  );
}
