import { useGLTF } from '@react-three/drei';
import { useState, useEffect } from 'react';

export function useAvatarModel(agentId: string) {
  const [modelExists, setModelExists] = useState<boolean | null>(null);
  const modelPath = `/models/${agentId}.glb`;

  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then(response => {
        setModelExists(response.ok);
      })
      .catch(() => {
        setModelExists(false);
      });
  }, [modelPath]);

  const gltf = useGLTF(modelPath);

  return { 
    model: modelExists === true ? gltf.scene : null, 
    loading: modelExists === null 
  };
}
