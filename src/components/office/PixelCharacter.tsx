import { useEffect, useState, useMemo } from "react";

interface PixelCharacterProps {
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
  deskType?: "large" | "normal" | "server";
}

export function PixelCharacter({
  agent,
  position,
  deskType = "normal",
}: PixelCharacterProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!agent.isActive) {
      return;
    }
    const typingInterval = setInterval(() => {
      setTyping((prev) => !prev);
    }, 800);
    return () => clearInterval(typingInterval);
  }, [agent.isActive]);

  const animationStyle = useMemo(() => {
    return typing ? "pixel-typing 0.8s infinite" : "pixel-idle 3s infinite";
  }, [typing]);

  const getDeskStyle = () => {
    switch (deskType) {
      case "large":
        return { width: "140px", height: "80px" };
      case "server":
        return { width: "100px", height: "100px" };
      default:
        return { width: "100px", height: "70px" };
    }
  };

  return (
    <div
      className="absolute pixel-character"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={() => setShowBubble(true)}
      onMouseLeave={() => setShowBubble(false)}
    >
      {/* Speech Bubble */}
      {showBubble && (
        <div
          className="absolute pixel-bubble"
          style={{
            bottom: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            color: "#000",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "2px solid #000",
            fontSize: "11px",
            fontFamily: "monospace",
            maxWidth: "200px",
            whiteSpace: "pre-wrap",
            zIndex: 100,
            boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
            animation: "bubble-pop 0.2s ease-out",
          }}
        >
          {agent.currentTask}
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "20px",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid #000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "22px",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #fff",
            }}
          />
        </div>
      )}

      {/* Desk */}
      <div
        className="pixel-desk"
        style={{
          ...getDeskStyle(),
          backgroundColor: deskType === "server" ? "#4a5568" : "#8b5a3c",
          border: "3px solid #000",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        {/* Monitor/Props */}
        {deskType === "large" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "60px",
              height: "40px",
              backgroundColor: "#1a1a1a",
              border: "3px solid #000",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                right: "3px",
                bottom: "3px",
                backgroundColor: agent.isActive ? agent.color : "#333",
                opacity: 0.8,
              }}
            />
          </div>
        )}

        {deskType === "normal" && (
          <>
            {/* Monitor */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "40px",
                height: "30px",
                backgroundColor: "#1a1a1a",
                border: "2px solid #000",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  right: "2px",
                  bottom: "2px",
                  backgroundColor: agent.isActive ? agent.color : "#333",
                  opacity: 0.7,
                }}
              />
            </div>
            {/* Keyboard */}
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "30px",
                height: "8px",
                backgroundColor: "#e5e5e5",
                border: "1px solid #000",
              }}
            />
          </>
        )}

        {deskType === "server" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "10px",
              bottom: "10px",
              backgroundColor: "#1a1a1a",
              border: "2px solid #000",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              padding: "4px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "8px",
                  backgroundColor: agent.isActive && i <= 2 ? "#4ade80" : "#666",
                  border: "1px solid #000",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Character */}
      <div
        className="absolute"
        style={{
          bottom: deskType === "server" ? "80px" : "50px",
          left: deskType === "large" ? "40px" : "30px",
          fontSize: "48px",
          filter: agent.isActive ? "none" : "grayscale(50%) opacity(70%)",
          animation: animationStyle,
        }}
      >
        {agent.emoji}
      </div>

      {/* Name Tag */}
      <div
        style={{
          position: "absolute",
          bottom: "-25px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#000",
          color: "#fff",
          padding: "2px 8px",
          fontSize: "10px",
          fontFamily: "monospace",
          fontWeight: "bold",
          border: "2px solid " + agent.color,
          whiteSpace: "nowrap",
        }}
      >
        {agent.name}
      </div>
    </div>
  );
}
