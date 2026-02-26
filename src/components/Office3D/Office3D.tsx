'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import type { AgentState } from './agentsConfig';
import AgentDesk from './AgentDesk';
import Floor from './Floor';
import Walls from './Walls';
import Lights from './Lights';
import AgentPanel from './AgentPanel';
import FileCabinet from './FileCabinet';
import Whiteboard from './Whiteboard';
import CoffeeMachine from './CoffeeMachine';
import PlantPot from './PlantPot';
import WallClock from './WallClock';
import FirstPersonControls from './FirstPersonControls';
import MovingAvatar from './MovingAvatar';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  status: 'online' | 'offline';
  activeSessions: number;
  lastActivity?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number];
  color: string;
  role: string;
}

// Generate positions dynamically based on number of agents
function generateAgentPositions(agents: Agent[]): AgentConfig[] {
  const positions: [number, number, number][] = [
    [0, 0, 0],     // Center
    [-4, 0, -3],   // Back left
    [4, 0, -3],    // Back right
    [-4, 0, 3],    // Front left
    [4, 0, 3],     // Front right
    [0, 0, 6],     // Front center
    [-6, 0, 0],    // Far left
    [6, 0, 0],     // Far right
  ];

  return agents.map((agent, index) => ({
    id: agent.id,
    name: agent.name || agent.id,
    emoji: agent.emoji || '🤖',
    position: positions[index % positions.length],
    color: agent.color || '#666666',
    role: agent.id === 'main' ? 'Main Agent' : 'Agent',
  }));
}

export default function Office3D() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [interactionModal, setInteractionModal] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'orbit' | 'fps'>('orbit');
  const [avatarPositions, setAvatarPositions] = useState<Map<string, any>>(new Map());
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [loading, setLoading] = useState(true);

  // Get agent state with fallback
  const getAgentState = (agentId: string): AgentState => {
    return agentStates[agentId] || {
      id: agentId,
      status: 'idle',
      model: 'unknown',
      tokensPerHour: 0,
      tasksInQueue: 0,
      uptime: 0,
    };
  };

  // Load static agent configs (every 5 minutes)
  useEffect(() => {
    const fetchAgentConfigs = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        const realAgents = data.agents || [];
        const configs = generateAgentPositions(realAgents);
        setAgents(configs);
      } catch (error) {
        console.error('Failed to load agent configs:', error);
        // Fallback to main agent only
        setAgents([{
          id: 'main',
          name: 'Main Agent',
          emoji: '🤖',
          position: [0, 0, 0],
          color: '#ff6b35',
          role: 'Main Agent',
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentConfigs();
    const interval = setInterval(fetchAgentConfigs, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Load dynamic agent statuses (every 10 seconds)
  useEffect(() => {
    const fetchAgentStatuses = async () => {
      try {
        const res = await fetch('/api/agents/status');
        const data = await res.json();
        
        if (data.agents) {
          const states: Record<string, AgentState> = {};
          data.agents.forEach((agent: any) => {
            states[agent.id] = {
              id: agent.id,
              status: agent.status,
              currentTask: agent.currentTask || 
                (agent.activeSessions > 0 ? `${agent.activeSessions} active sessions` : undefined),
              model: 'unknown',
              tokensPerHour: 0,
              tasksInQueue: agent.activeSessions || 0,
              uptime: 0,
              lastActivity: agent.lastActivity,
            };
          });
          setAgentStates(states);
        }
      } catch (error) {
        console.error('Failed to load agent statuses:', error);
        // Don't crash, keep previous states
      }
    };

    fetchAgentStatuses();
    const interval = setInterval(fetchAgentStatuses, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDeskClick = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleClosePanel = () => {
    setSelectedAgent(null);
  };

  const handleFileCabinetClick = () => {
    setInteractionModal('memory');
  };

  const handleWhiteboardClick = () => {
    setInteractionModal('roadmap');
  };

  const handleCoffeeClick = () => {
    setInteractionModal('energy');
  };

  const handleCloseModal = () => {
    setInteractionModal(null);
  };

  const handleAvatarPositionUpdate = (id: string, position: any) => {
    setAvatarPositions(prev => new Map(prev).set(id, position));
  };

  // Definir obstáculos (muebles)
  const obstacles = [
    // Escritorios
    ...agents.map(agent => ({
      position: new Vector3(agent.position[0], 0, agent.position[2]),
      radius: 1.5
    })),
    // Archivador
    { position: new Vector3(-8, 0, -5), radius: 0.8 },
    // Pizarra
    { position: new Vector3(0, 0, -8), radius: 1.5 },
    // Máquina de café
    { position: new Vector3(8, 0, -5), radius: 0.6 },
    // Plantas
    { position: new Vector3(-7, 0, 6), radius: 0.5 },
    { position: new Vector3(7, 0, 6), radius: 0.5 },
    { position: new Vector3(-9, 0, 0), radius: 0.4 },
    { position: new Vector3(9, 0, 0), radius: 0.4 },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center" style={{ height: '100vh', width: '100vw' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading office...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900" style={{ height: '100vh', width: '100vw' }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        }>
          {/* Iluminación */}
          <Lights />

          {/* Cielo y ambiente */}
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="sunset" />

          {/* Suelo */}
          <Floor />

          {/* Paredes */}
          <Walls />

          {/* Escritorios de agentes (sin avatares) */}
          {agents.map((agent) => (
            <AgentDesk
              key={agent.id}
              agent={agent}
              state={getAgentState(agent.id)}
              onClick={() => handleDeskClick(agent.id)}
              isSelected={selectedAgent === agent.id}
            />
          ))}

          {/* Avatares móviles */}
          {agents.map((agent) => (
            <MovingAvatar
              key={`avatar-${agent.id}`}
              agent={agent}
              state={getAgentState(agent.id)}
              officeBounds={{ minX: -8, maxX: 8, minZ: -7, maxZ: 7 }}
              obstacles={obstacles}
              otherAvatarPositions={avatarPositions}
              onPositionUpdate={handleAvatarPositionUpdate}
            />
          ))}

          {/* Mobiliario interactivo */}
          <FileCabinet
            position={[-8, 0, -5]}
            onClick={handleFileCabinetClick}
          />
          <Whiteboard
            position={[0, 0, -8]}
            rotation={[0, 0, 0]}
            onClick={handleWhiteboardClick}
          />
          <CoffeeMachine
            position={[8, 0.8, -5]}
            onClick={handleCoffeeClick}
          />

          {/* Decoración */}
          <PlantPot position={[-7, 0, 6]} size="large" />
          <PlantPot position={[7, 0, 6]} size="medium" />
          <PlantPot position={[-9, 0, 0]} size="small" />
          <PlantPot position={[9, 0, 0]} size="small" />
          <WallClock
            position={[0, 2.5, -8.4]}
            rotation={[0, 0, 0]}
          />

          {/* Controles de cámara */}
          {controlMode === 'orbit' ? (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2.2}
            />
          ) : (
            <FirstPersonControls moveSpeed={5} />
          )}
        </Suspense>
      </Canvas>

      {/* Panel lateral cuando se selecciona un agente */}
      {selectedAgent && agents.find(a => a.id === selectedAgent) && (
        <AgentPanel
          agent={agents.find(a => a.id === selectedAgent)!}
          state={getAgentState(selectedAgent)}
          onClose={handleClosePanel}
        />
      )}

      {/* Modal de interacciones con objetos */}
      {interactionModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                {interactionModal === 'memory' && '📁 Memory Browser'}
                {interactionModal === 'roadmap' && '📋 Roadmap & Planning'}
                {interactionModal === 'energy' && '☕ Agent Energy Dashboard'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-gray-300 space-y-4">
              {interactionModal === 'memory' && (
                <>
                  <p className="text-lg">🧠 Access to workspace memories and files</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Quick links:</p>
                    <ul className="space-y-2">
                      <li><a href="/memory" className="text-yellow-400 hover:underline">→ Full Memory Browser</a></li>
                      <li><a href="/files" className="text-yellow-400 hover:underline">→ File Explorer</a></li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    This would show a file tree of memory/*.md and workspace files
                  </p>
                </>
              )}

              {interactionModal === 'roadmap' && (
                <>
                  <p className="text-lg">🗺️ Project roadmap and planning board</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Active phases:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Phase 0: SuperBotijo Shell</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-400">●</span>
                        <span>Phase 8: The Office 3D (MVP)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gray-500">○</span>
                        <span>Phase 2: File Browser Pro</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    Full roadmap available at workspace/superbotijo/ROADMAP.md
                  </p>
                </>
              )}

              {interactionModal === 'energy' && (
                <>
                  <p className="text-lg">⚡ Agent activity and energy levels</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Tokens consumed today:</p>
                      <p className="text-2xl font-bold text-yellow-400">47,000</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active agents:</p>
                      <p className="text-2xl font-bold text-green-400">3 / 6</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">System uptime:</p>
                      <p className="text-2xl font-bold text-blue-400">12h 34m</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    This would show real-time agent mood/productivity metrics
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleCloseModal}
              className="mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Controles UI overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold mb-2">🏢 The Office</h2>
        <div className="text-sm space-y-1 mb-3">
          <p><strong>Mode: {controlMode === 'orbit' ? '🖱️ Orbit' : '🎮 FPS'}</strong></p>
          {controlMode === 'orbit' ? (
            <>
              <p>🖱️ Mouse: Rotar vista</p>
              <p>🔄 Scroll: Zoom</p>
              <p>👆 Click: Seleccionar</p>
            </>
          ) : (
            <>
              <p>Click to lock cursor</p>
              <p>WASD/Arrows: Mover</p>
              <p>Space: Subir | Shift: Bajar</p>
              <p>Mouse: Mirar | ESC: Unlock</p>
            </>
          )}
        </div>
        <button
          onClick={() => setControlMode(controlMode === 'orbit' ? 'fps' : 'orbit')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded text-xs transition-colors"
        >
          Switch to {controlMode === 'orbit' ? 'FPS Mode' : 'Orbit Mode'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h3 className="text-sm font-bold mb-2">Estados</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Thinking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}
