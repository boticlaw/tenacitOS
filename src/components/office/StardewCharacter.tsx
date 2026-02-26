// Stardew Valley style pixel art characters with AI hologram auras

interface CharacterProps {
  agent: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    role: string;
    currentTask: string;
    isActive: boolean;
  };
  position: { x: number; y: number };
}

export function StardewCharacter({ agent, position }: CharacterProps) {
  // Character appearance based on agent id
  const getCharacterDetails = () => {
    switch (agent.id) {
      case "main": // SuperBotijo - red/orange hair, red shirt
        return {
          hairColor: "#FF6B35",
          shirtColor: "#D94A3D",
          pantsColor: "#4A3018",
          skinColor: "#F4C4A0",
        };
      case "academic": // Profe - green hair, glasses, green jacket
        return {
          hairColor: "#4A8A4A",
          shirtColor: "#5A9A6A",
          pantsColor: "#3A4A5A",
          skinColor: "#F4C4A0",
          hasGlasses: true,
        };
      case "studio": // Studio - purple hair, headphones
        return {
          hairColor: "#9A4AAA",
          shirtColor: "#7A4A8A",
          pantsColor: "#2A2A3A",
          skinColor: "#F4C4A0",
          hasHeadphones: true,
        };
      case "linkedin": // LinkedIn Pro - dark blue hair, formal
        return {
          hairColor: "#2A4A7A",
          shirtColor: "#E4E4E4",
          pantsColor: "#1A2A3A",
          skinColor: "#F4C4A0",
          hasTie: true,
        };
      case "social": // Social - pink/magenta hair, sunglasses
        return {
          hairColor: "#FF4A9A",
          shirtColor: "#FFD700",
          pantsColor: "#4A4A8A",
          skinColor: "#F4C4A0",
          hasSunglasses: true,
        };
      case "infra": // Infra - orange hair, cap/helmet
        return {
          hairColor: "#FF8A4A",
          shirtColor: "#FF6B35",
          pantsColor: "#5A5A5A",
          skinColor: "#F4C4A0",
          hasCap: true,
        };
      default:
        return {
          hairColor: "#8B6545",
          shirtColor: "#4A7C59",
          pantsColor: "#4A3018",
          skinColor: "#F4C4A0",
        };
    }
  };

  const details = getCharacterDetails();
  const isActive = agent.isActive;

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Speech bubble with task (appears on hover or when active) */}
      {isActive && agent.currentTask && (
        <g className="speech-bubble" style={{ pointerEvents: "none" }}>
          {/* Bubble */}
          <rect
            x="-60"
            y="-70"
            width="120"
            height="50"
            rx="6"
            fill="#FFFEF4"
            stroke="#2A2A2A"
            strokeWidth="2"
            filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
          />
          <path d="M -10 -20 L -5 -10 L -15 -15 Z" fill="#FFFEF4" stroke="#2A2A2A" strokeWidth="2" />
          
          {/* Text */}
          <foreignObject x="-55" y="-65" width="110" height="45">
            <div
              style={{
                fontSize: "9px",
                fontFamily: "var(--font-body)",
                color: "#2A2A2A",
                padding: "4px",
                lineHeight: "1.3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {agent.currentTask}
            </div>
          </foreignObject>
        </g>
      )}

      {/* AI Hologram/Aura - blue/cyan glowing ghost next to character */}
      <g transform="translate(20, 0)">
        {/* Outer glow */}
        <ellipse
          cx="0"
          cy="12"
          rx="18"
          ry="20"
          fill="#4AFFFF"
          opacity="0.2"
          filter="blur(8px)"
        >
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* AI Ghost body */}
        <g opacity="0.8">
          {/* Head/body merged blob */}
          <ellipse cx="0" cy="0" rx="8" ry="9" fill="#6AFFFF" opacity="0.7">
            <animate attributeName="ry" values="9;10;9" dur="2s" repeatCount="indefinite" />
          </ellipse>
          
          {/* Lower body (wavy ghost tail) */}
          <path
            d="M -8 6 Q -8 16 -6 18 Q -4 20 -2 18 Q 0 16 2 18 Q 4 20 6 18 Q 8 16 8 6 Z"
            fill="#6AFFFF"
            opacity="0.7"
          >
            <animate
              attributeName="d"
              values="M -8 6 Q -8 16 -6 18 Q -4 20 -2 18 Q 0 16 2 18 Q 4 20 6 18 Q 8 16 8 6 Z;
                      M -8 6 Q -8 16 -6 19 Q -4 17 -2 19 Q 0 17 2 19 Q 4 17 6 19 Q 8 16 8 6 Z;
                      M -8 6 Q -8 16 -6 18 Q -4 20 -2 18 Q 0 16 2 18 Q 4 20 6 18 Q 8 16 8 6 Z"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* Eyes (glowing) */}
          <circle cx="-3" cy="-2" r="1.5" fill="#FFFFFF" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="3" cy="-2" r="1.5" fill="#FFFFFF" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Inner bright core */}
          <ellipse cx="0" cy="2" rx="4" ry="5" fill="#AFFFFF" opacity="0.4">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
          </ellipse>

          {/* Floating particles around hologram */}
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={Math.cos(i * 2.1) * 12}
              cy={Math.sin(i * 2.1) * 12}
              r="1"
              fill="#6AFFFF"
              opacity="0.6"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; ${Math.cos(i * 2.1) * 2},${Math.sin(i * 2.1) * 2}; 0,0`}
                dur="3s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
          ))}
        </g>

        {/* Binary code streaming effect */}
        {isActive && (
          <text
            x="0"
            y="-15"
            fontSize="4"
            fill="#4AFFFF"
            opacity="0.5"
            textAnchor="middle"
            fontFamily="monospace"
          >
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
            01
          </text>
        )}
      </g>

      {/* Main character (Stardew Valley style) */}
      <g>
        {/* Character shadow */}
        <ellipse cx="0" cy="28" rx="8" ry="3" fill="rgba(0,0,0,0.25)" />

        {/* Body/Torso */}
        <rect x="-5" y="10" width="10" height="12" rx="1" fill={details.shirtColor} stroke="#2A2A2A" strokeWidth="0.8" />
        
        {/* Arms */}
        <rect x="-7" y="12" width="3" height="8" rx="1" fill={details.skinColor} stroke="#2A2A2A" strokeWidth="0.5" />
        <rect x="4" y="12" width="3" height="8" rx="1" fill={details.skinColor} stroke="#2A2A2A" strokeWidth="0.5" />
        
        {/* Hands (pixel detail) */}
        <rect x="-7" y="19" width="3" height="3" rx="1" fill={details.skinColor} stroke="#2A2A2A" strokeWidth="0.4" />
        <rect x="4" y="19" width="3" height="3" rx="1" fill={details.skinColor} stroke="#2A2A2A" strokeWidth="0.4" />

        {/* Legs */}
        <rect x="-5" y="22" width="4" height="8" rx="0.5" fill={details.pantsColor} stroke="#2A2A2A" strokeWidth="0.5" />
        <rect x="1" y="22" width="4" height="8" rx="0.5" fill={details.pantsColor} stroke="#2A2A2A" strokeWidth="0.5" />
        
        {/* Shoes */}
        <ellipse cx="-3" cy="30" rx="2.5" ry="1.5" fill="#3A2010" stroke="#2A1808" strokeWidth="0.4" />
        <ellipse cx="3" cy="30" rx="2.5" ry="1.5" fill="#3A2010" stroke="#2A1808" strokeWidth="0.4" />

        {/* Head/Face */}
        <circle cx="0" cy="3" r="7" fill={details.skinColor} stroke="#2A2A2A" strokeWidth="0.8" />
        
        {/* Eyes */}
        {!details.hasSunglasses && (
          <>
            <circle cx="-2.5" cy="2" r="1" fill="#2A2A2A" />
            <circle cx="2.5" cy="2" r="1" fill="#2A2A2A" />
            {/* Eye shine */}
            <circle cx="-2" cy="1.5" r="0.4" fill="#FFFFFF" />
            <circle cx="3" cy="1.5" r="0.4" fill="#FFFFFF" />
          </>
        )}

        {/* Sunglasses (Social) */}
        {details.hasSunglasses && (
          <g>
            <rect x="-5" y="0.5" width="4" height="3" rx="0.5" fill="#2A2A2A" stroke="#1A1A1A" strokeWidth="0.5" />
            <rect x="1" y="0.5" width="4" height="3" rx="0.5" fill="#2A2A2A" stroke="#1A1A1A" strokeWidth="0.5" />
            <line x1="-1" y1="2" x2="1" y2="2" stroke="#2A2A2A" strokeWidth="0.8" />
            {/* Reflection */}
            <rect x="-4.5" y="1" width="1.5" height="1" fill="#4A9AFF" opacity="0.6" />
            <rect x="1.5" y="1" width="1.5" height="1" fill="#4A9AFF" opacity="0.6" />
          </g>
        )}

        {/* Glasses (Academic) */}
        {details.hasGlasses && (
          <g>
            <circle cx="-2.5" cy="2" r="2" fill="none" stroke="#3A3A3A" strokeWidth="0.6" />
            <circle cx="2.5" cy="2" r="2" fill="none" stroke="#3A3A3A" strokeWidth="0.6" />
            <line x1="-0.5" y1="2" x2="0.5" y2="2" stroke="#3A3A3A" strokeWidth="0.6" />
            {/* Lens glare */}
            <circle cx="-3" cy="1.5" r="0.8" fill="#FFFFFF" opacity="0.4" />
            <circle cx="3" cy="1.5" r="0.8" fill="#FFFFFF" opacity="0.4" />
          </g>
        )}

        {/* Mouth (simple) */}
        <line x1="-1.5" y1="5" x2="1.5" y2="5" stroke="#2A2A2A" strokeWidth="0.5" strokeLinecap="round" />

        {/* Hair */}
        <g>
          {/* Base hair shape */}
          <path
            d="M -7 0 Q -7 -6 0 -7 Q 7 -6 7 0 Q 7 4 5 5 L 5 2 Q 3 0 0 0 Q -3 0 -5 2 L -5 5 Q -7 4 -7 0 Z"
            fill={details.hairColor}
            stroke="#2A2A2A"
            strokeWidth="0.8"
          />
          {/* Hair strands detail */}
          <path d="M -3 -6 Q -2 -7 -1 -6" fill="none" stroke="#2A2A2A" strokeWidth="0.3" opacity="0.6" />
          <path d="M 1 -6 Q 2 -7 3 -6" fill="none" stroke="#2A2A2A" strokeWidth="0.3" opacity="0.6" />
        </g>

        {/* Tie (LinkedIn Pro) */}
        {details.hasTie && (
          <g>
            <path d="M 0 8 L -1.5 12 L -1 18 L 0 19 L 1 18 L 1.5 12 Z" fill="#8A2A2A" stroke="#5A1A1A" strokeWidth="0.4" />
            <path d="M -1 8 L 0 9 L 1 8" fill="#5A1A1A" />
          </g>
        )}

        {/* Headphones (Studio) */}
        {details.hasHeadphones && (
          <g>
            <path d="M -7 0 Q -8 -4 -8 0 L -8 4" fill="none" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 7 0 Q 8 -4 8 0 L 8 4" fill="none" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="-9" y="2" width="2" height="4" rx="0.5" fill="#5A5A5A" stroke="#3A3A3A" strokeWidth="0.5" />
            <rect x="7" y="2" width="2" height="4" rx="0.5" fill="#5A5A5A" stroke="#3A3A3A" strokeWidth="0.5" />
            {/* Mic */}
            <line x1="7" y1="6" x2="5" y2="8" stroke="#3A3A3A" strokeWidth="0.8" />
            <circle cx="5" cy="8" r="1" fill="#5A5A5A" stroke="#3A3A3A" strokeWidth="0.4" />
          </g>
        )}

        {/* Cap/Helmet (Infra) */}
        {details.hasCap && (
          <g>
            <ellipse cx="0" cy="-6" rx="8" ry="3" fill={details.hairColor} stroke="#2A2A2A" strokeWidth="0.8" />
            <rect x="-8" y="-6" width="16" height="5" fill={details.hairColor} stroke="#2A2A2A" strokeWidth="0.8" />
            {/* Visor */}
            <ellipse cx="0" cy="-1" rx="9" ry="2" fill="#3A3A3A" opacity="0.6" />
            {/* Cap logo/detail */}
            <circle cx="0" cy="-5" r="1.5" fill="#FFD700" stroke="#B89850" strokeWidth="0.4" />
          </g>
        )}

        {/* Activity indicator */}
        {isActive ? (
          // Active - subtle bounce animation
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-2; 0,0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </g>
        ) : (
          // Idle - "Zzz" sleep indicator
          <g opacity="0.6">
            <text x="10" y="-8" fontSize="6" fill="#4A4A4A" fontFamily="serif" fontStyle="italic">
              z
            </text>
            <text x="12" y="-12" fontSize="7" fill="#4A4A4A" fontFamily="serif" fontStyle="italic">
              z
            </text>
            <text x="15" y="-16" fontSize="8" fill="#4A4A4A" fontFamily="serif" fontStyle="italic">
              Z
            </text>
          </g>
        )}

        {/* Agent name label below character */}
        <text
          x="0"
          y="40"
          fontSize="8"
          fill="#FFFEF4"
          stroke="#2A2A2A"
          strokeWidth="2"
          paintOrder="stroke"
          textAnchor="middle"
          fontFamily="var(--font-body)"
          fontWeight="bold"
        >
          {agent.name}
        </text>

        {/* Status dot below name */}
        <circle
          cx="0"
          cy="48"
          r="3"
          fill={isActive ? "#4AFF88" : "#6B7280"}
          stroke="#2A2A2A"
          strokeWidth="1"
        >
          {isActive && <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />}
        </circle>
      </g>

      {/* Hover interaction area */}
      <circle
        cx="0"
        cy="15"
        r="25"
        fill="transparent"
        style={{ cursor: "pointer" }}
        onMouseEnter={(e) => {
          const bubble = e.currentTarget.previousSibling as SVGElement;
          if (bubble) bubble.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          const bubble = e.currentTarget.previousSibling as SVGElement;
          if (bubble && !isActive) bubble.style.opacity = "0";
        }}
      />

      <style jsx>{`
        .speech-bubble {
          opacity: ${isActive ? "1" : "0"};
          transition: opacity 0.3s ease;
          animation: bubble-pop 0.3s ease;
        }

        @keyframes bubble-pop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </g>
  );
}
