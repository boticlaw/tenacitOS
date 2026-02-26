import React, { useState } from "react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  currentTask: string;
  isActive: boolean;
}

interface ZeldaCharacterProps {
  agent: Agent;
  position: { x: number; y: number }; // Grid coordinates
}

// Pixel art sprites for each agent (64x64 SVG top-down view)
const AgentSprites: Record<string, React.ReactElement> = {
  main: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* SuperBotijo - Rojo/naranja con pinzas de langosta */}
      {/* Body */}
      <rect x="20" y="26" width="24" height="24" fill="#ff6b35" />
      <rect x="22" y="28" width="20" height="20" fill="#ff8855" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#ff6b35" />
      <rect x="26" y="18" width="12" height="9" fill="#ffaa88" />
      {/* Eyes */}
      <rect x="27" y="20" width="3" height="3" fill="#000" />
      <rect x="34" y="20" width="3" height="3" fill="#000" />
      {/* Lobster claws on head */}
      <path d="M 16 12 L 14 9 L 16 6 L 20 9 Z" fill="#cc4422" />
      <path d="M 48 12 L 50 9 L 48 6 L 44 9 Z" fill="#cc4422" />
      <rect x="16" y="9" width="4" height="6" fill="#ff6b35" />
      <rect x="44" y="9" width="4" height="6" fill="#ff6b35" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#dd5533" />
      <rect x="34" y="50" width="8" height="12" fill="#dd5533" />
    </svg>
  ),
  academic: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* Profe - Verde con birrete */}
      {/* Body */}
      <rect x="20" y="26" width="24" height="24" fill="#4ade80" />
      <rect x="22" y="28" width="20" height="20" fill="#6ef09a" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#f4d1ae" />
      {/* Eyes */}
      <rect x="27" y="20" width="3" height="3" fill="#000" />
      <rect x="34" y="20" width="3" height="3" fill="#000" />
      {/* Graduation cap */}
      <rect x="20" y="8" width="24" height="6" fill="#059669" />
      <rect x="22" y="11" width="20" height="3" fill="#10b981" />
      <rect x="44" y="8" width="8" height="3" fill="#059669" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#22c55e" />
      <rect x="34" y="50" width="8" height="12" fill="#22c55e" />
    </svg>
  ),
  studio: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* Studio - Púrpura con auriculares */}
      {/* Body */}
      <rect x="20" y="26" width="24" height="24" fill="#a855f7" />
      <rect x="22" y="28" width="20" height="20" fill="#c084fc" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#f4d1ae" />
      {/* Eyes */}
      <rect x="27" y="20" width="3" height="3" fill="#000" />
      <rect x="34" y="20" width="3" height="3" fill="#000" />
      {/* Headphones */}
      <rect x="14" y="14" width="6" height="12" fill="#7c3aed" />
      <rect x="44" y="14" width="6" height="12" fill="#7c3aed" />
      <rect x="20" y="11" width="24" height="3" fill="#7c3aed" />
      <circle cx="17" cy="20" r="4" fill="#6366f1" />
      <circle cx="47" cy="20" r="4" fill="#6366f1" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#9333ea" />
      <rect x="34" y="50" width="8" height="12" fill="#9333ea" />
    </svg>
  ),
  linkedin: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* LinkedIn Pro - Azul con corbata/traje */}
      {/* Body (suit) */}
      <rect x="20" y="26" width="24" height="24" fill="#0a66c2" />
      <rect x="22" y="28" width="20" height="20" fill="#2563eb" />
      {/* Tie */}
      <rect x="30" y="26" width="4" height="18" fill="#1e40af" />
      <rect x="28" y="26" width="8" height="3" fill="#1e40af" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#f4d1ae" />
      {/* Eyes */}
      <rect x="27" y="20" width="3" height="3" fill="#000" />
      <rect x="34" y="20" width="3" height="3" fill="#000" />
      {/* Hair */}
      <rect x="22" y="11" width="20" height="3" fill="#4b5563" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#1e3a8a" />
      <rect x="34" y="50" width="8" height="12" fill="#1e3a8a" />
    </svg>
  ),
  social: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* Social - Rosa/magenta con gafas de sol */}
      {/* Body */}
      <rect x="20" y="26" width="24" height="24" fill="#ec4899" />
      <rect x="22" y="28" width="20" height="20" fill="#f472b6" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#f4d1ae" />
      {/* Sunglasses */}
      <rect x="22" y="18" width="8" height="6" fill="#1f2937" />
      <rect x="34" y="18" width="8" height="6" fill="#1f2937" />
      <rect x="30" y="20" width="4" height="3" fill="#1f2937" />
      {/* Hair */}
      <rect x="22" y="11" width="20" height="3" fill="#c026d3" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#db2777" />
      <rect x="34" y="50" width="8" height="12" fill="#db2777" />
    </svg>
  ),
  infra: (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* Infra - Gris/naranja con casco */}
      {/* Body */}
      <rect x="20" y="26" width="24" height="24" fill="#6b7280" />
      <rect x="22" y="28" width="20" height="20" fill="#9ca3af" />
      {/* Head */}
      <rect x="22" y="14" width="20" height="12" fill="#f4d1ae" />
      {/* Eyes */}
      <rect x="27" y="20" width="3" height="3" fill="#000" />
      <rect x="34" y="20" width="3" height="3" fill="#000" />
      {/* Hard hat / helmet */}
      <rect x="20" y="8" width="24" height="6" fill="#fb923c" />
      <rect x="22" y="11" width="20" height="3" fill="#fdba74" />
      <rect x="28" y="5" width="8" height="3" fill="#f97316" />
      {/* Legs */}
      <rect x="22" y="50" width="8" height="12" fill="#52525b" />
      <rect x="34" y="50" width="8" height="12" fill="#52525b" />
    </svg>
  ),
};

export function ZeldaCharacter({ agent, position }: ZeldaCharacterProps) {
  const [showBubble, setShowBubble] = useState(false);

  const sprite = AgentSprites[agent.id] || AgentSprites.main;

  // Animation states
  const isMoving = agent.isActive;

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "64px",
        height: "64px",
        zIndex: Math.floor(position.y / 10) + 10,
        transform: isMoving ? "translateY(-2px)" : "none",
        animation: isMoving ? "zelda-bounce 0.6s ease-in-out infinite" : "none",
        cursor: "pointer",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={() => setShowBubble(true)}
      onMouseLeave={() => setShowBubble(false)}
    >
      {/* Character sprite */}
      <div
        style={{
          filter: agent.isActive
            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            : "grayscale(0.3) brightness(0.8)",
          imageRendering: "pixelated",
        }}
      >
        {sprite}
      </div>

      {/* Idle indicator (zzZ) */}
      {!agent.isActive && (
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-16px",
            fontSize: "20px",
            animation: "zelda-float 2s ease-in-out infinite",
            opacity: 0.7,
          }}
        >
          zzZ
        </div>
      )}

      {/* Active indicator (sparkle) */}
      {agent.isActive && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            width: "12px",
            height: "12px",
            backgroundColor: "#fbbf24",
            borderRadius: "50%",
            animation: "zelda-pulse 1s ease-in-out infinite",
            boxShadow: "0 0 12px #fbbf24",
          }}
        />
      )}

      {/* Name label */}
      <div
        style={{
          position: "absolute",
          top: "68px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontFamily: "var(--font-body)",
          whiteSpace: "nowrap",
          border: `2px solid ${agent.color}`,
          pointerEvents: "none",
        }}
      >
        {agent.name}
      </div>

      {/* Speech bubble with current task */}
      {showBubble && agent.currentTask && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            color: "#000",
            padding: "10px 14px",
            borderRadius: "12px",
            fontSize: "12px",
            fontFamily: "monospace",
            maxWidth: "220px",
            border: "3px solid #000",
            boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "zelda-bubble-pop 0.3s ease-out",
            pointerEvents: "none",
          }}
        >
          {agent.currentTask}
          {/* Speech bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "12px solid #000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "10px solid #fff",
            }}
          />
        </div>
      )}
    </div>
  );
}
