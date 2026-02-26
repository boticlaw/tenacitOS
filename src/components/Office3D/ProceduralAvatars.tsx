'use client';

import { Box, Sphere, Cylinder, Cone } from '@react-three/drei';
import type { AgentConfig } from './agentsConfig';

interface ProceduralAvatarProps {
  agent: AgentConfig;
  position: [number, number, number];
}

// Cangrejo 3D (SuperBotijo)
function CrabAvatar({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Cuerpo */}
      <Sphere args={[0.25, 16, 16]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Ojos */}
      <Sphere args={[0.08, 8, 8]} position={[-0.12, 0.15, 0.2]} castShadow>
        <meshStandardMaterial color="white" />
      </Sphere>
      <Sphere args={[0.08, 8, 8]} position={[0.12, 0.15, 0.2]} castShadow>
        <meshStandardMaterial color="white" />
      </Sphere>
      
      {/* Pupilas */}
      <Sphere args={[0.04, 8, 8]} position={[-0.12, 0.15, 0.26]} castShadow>
        <meshStandardMaterial color="black" />
      </Sphere>
      <Sphere args={[0.04, 8, 8]} position={[0.12, 0.15, 0.26]} castShadow>
        <meshStandardMaterial color="black" />
      </Sphere>
      
      {/* Pinzas */}
      <group position={[-0.3, 0, 0]} rotation={[0, 0, -0.3]}>
        <Cylinder args={[0.04, 0.04, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <meshStandardMaterial color={color} />
        </Cylinder>
        <Box args={[0.12, 0.08, 0.04]} position={[0.15, 0, 0]} castShadow>
          <meshStandardMaterial color={color} />
        </Box>
      </group>
      
      <group position={[0.3, 0, 0]} rotation={[0, 0, 0.3]}>
        <Cylinder args={[0.04, 0.04, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <meshStandardMaterial color={color} />
        </Cylinder>
        <Box args={[0.12, 0.08, 0.04]} position={[-0.15, 0, 0]} castShadow>
          <meshStandardMaterial color={color} />
        </Box>
      </group>
      
      {/* Patas */}
      {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
        <Cylinder key={i} args={[0.02, 0.02, 0.15]} position={[x, -0.2, 0]} castShadow>
          <meshStandardMaterial color={color} />
        </Cylinder>
      ))}
    </group>
  );
}

// Robot 3D (Infra)
function RobotAvatar({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Cabeza */}
      <Box args={[0.25, 0.25, 0.25]} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* Antena */}
      <Cylinder args={[0.02, 0.02, 0.15]} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.5} />
      </Cylinder>
      <Sphere args={[0.04, 8, 8]} position={[0, 0.63, 0]} castShadow>
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.8} />
      </Sphere>
      
      {/* Ojos (LEDs) */}
      <Box args={[0.08, 0.06, 0.02]} position={[-0.08, 0.38, 0.13]} castShadow>
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
      </Box>
      <Box args={[0.08, 0.06, 0.02]} position={[0.08, 0.38, 0.13]} castShadow>
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
      </Box>
      
      {/* Cuerpo */}
      <Box args={[0.3, 0.4, 0.2]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* Panel frontal */}
      <Box args={[0.2, 0.25, 0.02]} position={[0, 0, 0.11]} castShadow>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      
      {/* Brazos */}
      <Cylinder args={[0.05, 0.05, 0.35]} position={[-0.2, -0.05, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.35]} position={[0.2, -0.05, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Manos (herramientas) */}
      <Box args={[0.08, 0.08, 0.08]} position={[-0.2, -0.25, 0]} castShadow>
        <meshStandardMaterial color="#ff6600" />
      </Box>
      <Box args={[0.08, 0.08, 0.08]} position={[0.2, -0.25, 0]} castShadow>
        <meshStandardMaterial color="#ff6600" />
      </Box>
      
      {/* Piernas */}
      <Cylinder args={[0.06, 0.06, 0.3]} position={[-0.08, -0.35, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.3]} position={[0.08, -0.35, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

// Humanoide simple (base para profesor, ejecutivo, etc.)
function HumanoidAvatar({ 
  color, 
  position, 
  accessory 
}: { 
  color: string; 
  position: [number, number, number];
  accessory?: 'book' | 'briefcase' | 'camera' | 'phone';
}) {
  return (
    <group position={position}>
      {/* Cabeza */}
      <Sphere args={[0.12, 16, 16]} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color="#ffdbac" />
      </Sphere>
      
      {/* Pelo/gorro */}
      <Sphere args={[0.13, 16, 16]} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#3d2817" />
      </Sphere>
      
      {/* Ojos */}
      <Sphere args={[0.02, 8, 8]} position={[-0.05, 0.42, 0.11]} castShadow>
        <meshStandardMaterial color="black" />
      </Sphere>
      <Sphere args={[0.02, 8, 8]} position={[0.05, 0.42, 0.11]} castShadow>
        <meshStandardMaterial color="black" />
      </Sphere>
      
      {/* Cuerpo */}
      <Box args={[0.25, 0.35, 0.15]} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      
      {/* Brazos */}
      <Cylinder args={[0.04, 0.04, 0.3]} position={[-0.16, 0.1, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Cylinder args={[0.04, 0.04, 0.3]} position={[0.16, 0.1, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Piernas */}
      <Cylinder args={[0.05, 0.05, 0.3]} position={[-0.07, -0.15, 0]} castShadow>
        <meshStandardMaterial color="#2c5aa0" />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.3]} position={[0.07, -0.15, 0]} castShadow>
        <meshStandardMaterial color="#2c5aa0" />
      </Cylinder>
      
      {/* Accesorios */}
      {accessory === 'book' && (
        <Box args={[0.12, 0.15, 0.03]} position={[0.2, 0, 0.1]} rotation={[0, -0.3, 0]} castShadow>
          <meshStandardMaterial color="#8B4513" />
        </Box>
      )}
      
      {accessory === 'briefcase' && (
        <Box args={[0.12, 0.1, 0.06]} position={[0.22, -0.05, 0]} castShadow>
          <meshStandardMaterial color="#1a1a1a" />
        </Box>
      )}
      
      {accessory === 'camera' && (
        <group position={[0.18, 0.05, 0.12]}>
          <Box args={[0.1, 0.08, 0.06]} castShadow>
            <meshStandardMaterial color="#2d2d2d" />
          </Box>
          <Cylinder args={[0.04, 0.04, 0.05]} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.05]} castShadow>
            <meshStandardMaterial color="#1a1a1a" />
          </Cylinder>
        </group>
      )}
      
      {accessory === 'phone' && (
        <Box args={[0.06, 0.1, 0.01]} position={[0.18, 0.15, 0.08]} rotation={[0, -0.2, 0]} castShadow>
          <meshStandardMaterial color="#1a1a1a" emissive="#4488ff" emissiveIntensity={0.3} />
        </Box>
      )}
    </group>
  );
}

export default function ProceduralAvatar({ agent, position }: ProceduralAvatarProps) {
  switch (agent.id) {
    case 'main':
      return <CrabAvatar color={agent.color} position={position} />;
    
    case 'infra':
      return <RobotAvatar color={agent.color} position={position} />;
    
    case 'academic':
      return <HumanoidAvatar color={agent.color} position={position} accessory="book" />;
    
    case 'linkedin':
      return <HumanoidAvatar color={agent.color} position={position} accessory="briefcase" />;
    
    case 'studio':
      return <HumanoidAvatar color={agent.color} position={position} accessory="camera" />;
    
    case 'social':
      return <HumanoidAvatar color={agent.color} position={position} accessory="phone" />;
    
    default:
      // Fallback sphere
      return (
        <Sphere args={[0.2, 16, 16]} position={position} castShadow>
          <meshStandardMaterial color={agent.color} />
        </Sphere>
      );
  }
}
