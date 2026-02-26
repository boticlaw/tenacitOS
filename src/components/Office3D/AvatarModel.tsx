'use client';

import { useGLTF } from '@react-three/drei';
import { Sphere } from '@react-three/drei';
import type { AgentConfig } from './agentsConfig';
import { useEffect, useState, useMemo } from 'react';

interface AvatarModelProps {
  agent: AgentConfig;
  position: [number, number, number];
}

export default function AvatarModel({ agent, position }: AvatarModelProps) {
  const modelPath = `/models/${agent.id}.glb`;
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then(res => setExists(res.ok))
      .catch(() => setExists(false));
  }, [modelPath]);

  const fallback = useMemo(() => (
    <Sphere
      args={[0.3, 16, 16]}
      position={position}
      castShadow
    >
      <meshStandardMaterial
        color={agent.color}
        emissive={agent.color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  ), [position, agent.color]);

  const { scene } = useGLTF(modelPath);

  if (exists === false) {
    return fallback;
  }

  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={0.8}
      rotation={[0, Math.PI, 0]}
      castShadow
      receiveShadow
    />
  );
}

useGLTF.preload('/models/main.glb');
useGLTF.preload('/models/academic.glb');
useGLTF.preload('/models/studio.glb');
useGLTF.preload('/models/linkedin.glb');
useGLTF.preload('/models/social.glb');
useGLTF.preload('/models/infra.glb');
useGLTF.preload('/models/devclaw.glb');
