"use client";

import { useRef, useEffect, useState } from "react";
import { BRANDING } from "@/config/branding";

interface OfficeAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  currentTask: string;
  isActive: boolean;
}

interface OfficeCanvasProps {
  agents: OfficeAgent[];
}

// Agent positions - top-down perspective (coordinates for 1920x1080 background, scaled to canvas)
const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  main: { x: 960, y: 700 },      // Center (moved 200px down)
  academic: { x: 400, y: 350 },  // Top-left zone
  studio: { x: 400, y: 750 },    // Bottom-left zone
  linkedin: { x: 1520, y: 350 }, // Top-right zone
  social: { x: 1520, y: 750 },   // Bottom-right zone
  infra: { x: 1720, y: 550 },    // Right-center zone (moved 200px right total)
  devclaw: { x: 960, y: 250 },   // Top-center zone
};

// Map agent IDs to sprite filenames
const SPRITE_FILES: Record<string, string> = {
  main: "/office/sprite-superbotijo.png",
  academic: "/office/sprite-profe.png",
  studio: "/office/sprite-studio.png",
  linkedin: "/office/sprite-linkedin.png",
  social: "/office/sprite-social.png",
  infra: "/office/sprite-infra.png",
  devclaw: "/office/sprite-devclaw.png",
};

const PALETTE = {
  ui: {
    bubble: "#FFFEF4",
    text: "#2A2A2A",
    outline: "#000000",
  },
};

export function OfficeCanvas({ agents }: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  // Store loaded and processed images
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [spriteImages, setSpriteImages] = useState<Record<string, HTMLCanvasElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load and process images on mount
  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      try {
        // Load background
        const bg = new Image();
        bg.src = "/office/bg-office.png";
        await new Promise((resolve, reject) => {
          bg.onload = resolve;
          bg.onerror = reject;
        });

        // Load and process all sprites with chroma key
        const processedSprites: Record<string, HTMLCanvasElement> = {};
        
        for (const [agentId, spritePath] of Object.entries(SPRITE_FILES)) {
          const img = new Image();
          img.src = spritePath;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          // Process chroma key
          const processed = processChromaKey(img);
          processedSprites[agentId] = processed;
        }

        if (mounted) {
          setBgImage(bg);
          setSpriteImages(processedSprites);
          setImagesLoaded(true);
        }
      } catch (error) {
        console.error("Error loading office images:", error);
      }
    };

    loadImages();

    return () => {
      mounted = false;
    };
  }, []);

  // Process sprite with chroma key (remove green #00FF00)
  const processChromaKey = (img: HTMLImageElement): HTMLCanvasElement => {
    const offscreen = document.createElement("canvas");
    offscreen.width = img.width;
    offscreen.height = img.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return offscreen;

    // Draw sprite
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;

    // Remove green pixels (chroma key)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is green (#00FF00 or close to it)
      if (r < 50 && g > 200 && b < 50) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
      // White chroma key removed - PNGs now have proper transparency
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);
    return offscreen;
  };

  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 675;

    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      render(ctx, timeRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [agents, hoveredAgent, imagesLoaded, bgImage, spriteImages]);

  const render = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, 1200, 675);

    // 1. Draw background
    if (bgImage) {
      // Scale background to fit canvas (1920x1080 -> 1200x675)
      ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height, 0, 0, 1200, 675);
    }

    // 2. Draw agents (sprites)
    agents.forEach((agent) => {
      const position = AGENT_POSITIONS[agent.id];
      const sprite = spriteImages[agent.id];
      if (position && sprite) {
        drawAgent(ctx, agent, sprite, position, time, hoveredAgent === agent.id);
      }
    });

    // 3. Draw speech bubbles
    agents.forEach((agent) => {
      const position = AGENT_POSITIONS[agent.id];
      if (position && (agent.isActive || hoveredAgent === agent.id)) {
        drawSpeechBubble(ctx, agent, position);
      }
    });
  };

  const drawAgent = (
    ctx: CanvasRenderingContext2D,
    agent: OfficeAgent,
    sprite: HTMLCanvasElement,
    position: { x: number; y: number },
    time: number,
    isHovered: boolean
  ) => {
    // Scale position from 1920x1080 to 1200x675
    const x = (position.x / 1920) * 1200;
    const y = (position.y / 1080) * 675;

    // Animate bounce - each agent has a unique phase offset
    const phaseOffset = agent.id.charCodeAt(0) * 0.7;
    const bobSpeed = agent.isActive ? 3 : 1.5;
    const bobAmount = agent.isActive ? 5 : 3;
    const bobY = Math.sin(time * bobSpeed + phaseOffset) * bobAmount;

    // Calculate sprite dimensions (target height ~120-140px)
    const baseHeight = 195; // 130 * 1.5x
    const agentScale = agent.id === "infra" ? 1.2 : agent.id === "main" ? 0.75 : 1.0;
    const targetHeight = baseHeight * agentScale;
    const scale = targetHeight / sprite.height;
    const spriteWidth = sprite.width * scale;
    const spriteHeight = sprite.height * scale;

    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(x, y + spriteHeight / 2 + 5, spriteWidth / 3, spriteHeight / 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw sprite (centered on position)
    ctx.save();
    ctx.drawImage(
      sprite,
      x - spriteWidth / 2,
      y - spriteHeight / 2 + bobY,
      spriteWidth,
      spriteHeight
    );
    ctx.restore();

    // Sleep zzZ indicator for inactive
    if (!agent.isActive) {
      drawSleepIndicator(ctx, x, y - spriteHeight / 2 + bobY, time);
    }

    // Name label
    ctx.save();
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    // Outline
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeText(agent.name, x, y + spriteHeight / 2 + 10);
    
    // Fill
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(agent.name, x, y + spriteHeight / 2 + 10);
    ctx.restore();

    // Status indicator
    const statusSize = 12;
    const statusX = x - statusSize / 2;
    const statusY = y + spriteHeight / 2 + 32;

    ctx.fillStyle = agent.isActive ? "#4AFF88" : "#666666";
    ctx.fillRect(statusX, statusY, statusSize, statusSize);
    
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(statusX, statusY, statusSize, statusSize);

    // Pulsing effect for active
    if (agent.isActive) {
      const pulse = Math.sin(time * 4);
      if (pulse > 0.3) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#AAFFAA";
        ctx.fillRect(statusX - 2, statusY - 2, statusSize + 4, statusSize + 4);
        ctx.restore();
      }
    }

    // Hover highlight
    if (isHovered) {
      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.strokeRect(
        x - spriteWidth / 2 - 5,
        y - spriteHeight / 2 + bobY - 5,
        spriteWidth + 10,
        spriteHeight + 10
      );
      ctx.restore();
    }
  };

  const drawSleepIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ) => {
    const offset1 = Math.sin(time * 2) * 2;
    const offset2 = Math.sin(time * 2 + 0.5) * 3;
    const offset3 = Math.sin(time * 2 + 1) * 4;

    ctx.save();
    ctx.font = "18px monospace";
    ctx.textAlign = "left";
    
    // Outline
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeText("z", x + 25, y - 20 + offset1);
    ctx.strokeText("z", x + 35, y - 28 + offset2);
    ctx.strokeText("Z", x + 45, y - 36 + offset3);
    
    // Fill
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("z", x + 25, y - 20 + offset1);
    ctx.fillText("z", x + 35, y - 28 + offset2);
    ctx.fillText("Z", x + 45, y - 36 + offset3);
    ctx.restore();
  };

  const drawSpeechBubble = (
    ctx: CanvasRenderingContext2D,
    agent: OfficeAgent,
    position: { x: number; y: number }
  ) => {
    if (!agent.currentTask) return;

    // Scale position
    const x = (position.x / 1920) * 1200;
    const y = (position.y / 1080) * 675;

    const bubbleW = 280;
    const bubbleH = 80;
    const bubbleX = x - bubbleW / 2;
    const bubbleY = y - 120;
    const padding = 12;
    const cornerRadius = 8;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    roundRect(ctx, bubbleX + 3, bubbleY + 3, bubbleW, bubbleH, cornerRadius);
    ctx.fill();
    ctx.restore();

    // Bubble background
    ctx.fillStyle = PALETTE.ui.bubble;
    roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, cornerRadius);
    ctx.fill();

    // Bubble outline
    ctx.strokeStyle = PALETTE.ui.outline;
    ctx.lineWidth = 2;
    roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, cornerRadius);
    ctx.stroke();

    // Tail (simple triangle pointing down)
    ctx.beginPath();
    ctx.moveTo(x - 10, bubbleY + bubbleH);
    ctx.lineTo(x + 10, bubbleY + bubbleH);
    ctx.lineTo(x, bubbleY + bubbleH + 15);
    ctx.closePath();
    ctx.fillStyle = PALETTE.ui.bubble;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ui.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text (word wrap)
    ctx.font = "13px monospace";
    ctx.fillStyle = PALETTE.ui.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const words = agent.currentTask.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const maxWidth = bubbleW - padding * 2;

    words.forEach((word) => {
      const testLine = currentLine + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== "") {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine.trim());

    const lineHeight = 18;
    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, bubbleX + padding, bubbleY + padding + i * lineHeight);
    });
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 1200;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 675;

    let newHoveredAgent: string | null = null;
    agents.forEach((agent) => {
      const position = AGENT_POSITIONS[agent.id];
      const sprite = spriteImages[agent.id];
      if (position && sprite) {
        const x = (position.x / 1920) * 1200;
        const y = (position.y / 1080) * 675;
        const targetHeight = 195; // 130 * 1.5x
        const scale = targetHeight / sprite.height;
        const spriteWidth = sprite.width * scale;
        const spriteHeight = sprite.height * scale;

        // Check if mouse is within sprite bounds
        if (
          mouseX >= x - spriteWidth / 2 &&
          mouseX <= x + spriteWidth / 2 &&
          mouseY >= y - spriteHeight / 2 &&
          mouseY <= y + spriteHeight / 2
        ) {
          newHoveredAgent = agent.id;
        }
      }
    });

    setHoveredAgent(newHoveredAgent);
  };

  if (!imagesLoaded) {
    return (
      <div style={{ 
        width: "1200px", 
        height: "675px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#1a1a2a",
        border: "4px solid #2A2A2A",
        color: "#FFD700",
        fontFamily: "monospace",
        fontSize: "18px"
      }}>
        Loading office sprites...
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "16px",
          textAlign: "center",
          color: "#FFD700",
          textShadow: "2px 2px 0 #000",
          marginBottom: "16px",
          letterSpacing: "4px",
        }}
      >
        ${BRANDING.companyName}
      </h2>
      <canvas
        ref={canvasRef}
        width={1200}
        height={675}
        onMouseMove={handleMouseMove}
        style={{
          imageRendering: "pixelated",
          cursor: hoveredAgent ? "pointer" : "default",
          border: "4px solid #2A2A2A",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
          background: "#000",
          maxWidth: "100%",
          height: "auto",
        } as React.CSSProperties}
      />
    </div>
  );
}
