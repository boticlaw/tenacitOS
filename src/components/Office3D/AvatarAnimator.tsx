import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type AvatarState = "idle" | "typing" | "thinking" | "error";

interface AvatarAnimatorProps {
  state: AvatarState;
  children: React.ReactNode;
}

export function AvatarAnimator({ state, children }: AvatarAnimatorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const currentState = useRef<AvatarState>(state);

  const animations = useMemo(
    () => ({
      idle: {
        breatheSpeed: 1.5,
        breatheAmount: 0.02,
        swaySpeed: 0.5,
        swayAmount: 0.01,
      },
      typing: {
        bobSpeed: 8,
        bobAmount: 0.03,
        tiltSpeed: 4,
        tiltAmount: 0.05,
      },
      thinking: {
        floatSpeed: 2,
        floatAmount: 0.05,
        rotateSpeed: 0.5,
      },
      error: {
        shakeSpeed: 20,
        shakeAmount: 0.02,
        pulseSpeed: 3,
      },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    time.current += delta;

    if (currentState.current !== state) {
      currentState.current = state;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }

    switch (state) {
      case "idle": {
        const c = animations.idle;
        groupRef.current.position.y = Math.sin(time.current * c.breatheSpeed) * c.breatheAmount;
        groupRef.current.rotation.z = Math.sin(time.current * c.swaySpeed) * c.swayAmount;
        groupRef.current.rotation.x = 0;
        break;
      }

      case "typing": {
        const c = animations.typing;
        groupRef.current.position.y = Math.abs(Math.sin(time.current * c.bobSpeed)) * c.bobAmount;
        groupRef.current.rotation.x = Math.sin(time.current * c.tiltSpeed) * c.tiltAmount;
        groupRef.current.rotation.z = 0;
        break;
      }

      case "thinking": {
        const c = animations.thinking;
        groupRef.current.position.y = Math.sin(time.current * c.floatSpeed) * c.floatAmount;
        groupRef.current.rotation.y += delta * c.rotateSpeed;
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
        break;
      }

      case "error": {
        const c = animations.error;
        groupRef.current.position.x = (Math.random() - 0.5) * c.shakeAmount;
        groupRef.current.position.y = Math.sin(time.current * c.pulseSpeed) * 0.01;
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
        break;
      }
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export function mapStatusToState(status: string): AvatarState {
  switch (status?.toLowerCase()) {
    case "working":
    case "active":
      return "typing";
    case "thinking":
      return "thinking";
    case "error":
    case "failed":
      return "error";
    default:
      return "idle";
  }
}
