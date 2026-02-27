import { NextResponse } from "next/server";
import { getActivities } from "@/lib/activities-db";

export const dynamic = "force-dynamic";

type MoodType = "productive" | "busy" | "idle" | "frustrated" | "neutral";

interface MoodResponse {
  mood: MoodType;
  emoji: string;
  score: number;
  streak: number;
  metrics: {
    activityCount: number;
    successRate: number;
    avgTokensPerHour: number;
    errorCount: number;
    criticalErrorCount: number;
  };
  description: string;
}

const MOOD_CONFIGS: Record<MoodType, { emoji: string; description: string }> = {
  productive: { emoji: "🚀", description: "SuperBotijo is highly productive and crushing tasks!" },
  busy: { emoji: "💼", description: "SuperBotijo is busy handling multiple tasks." },
  idle: { emoji: "😴", description: "SuperBotijo is idle, waiting for tasks." },
  frustrated: { emoji: "😤", description: "SuperBotijo has encountered several errors recently." },
  neutral: { emoji: "🙂", description: "SuperBotijo is operating normally." },
};

function calculateMood(
  activities: Array<{ timestamp: string; status: string; type: string; tokens_used: number | null }>,
  weekActivities: Array<{ timestamp: string; status: string; type: string }>
): MoodResponse {
  const now = new Date();

  const activityCount = activities.length;
  const successCount = activities.filter((a) => a.status === "success").length;
  const errorCount = activities.filter((a) => a.status === "error").length;
  const criticalErrorCount = activities.filter(
    (a) => a.status === "error" && (a.type === "system" || a.type === "security" || a.type === "build")
  ).length;
  const successRate = activityCount > 0 ? (successCount / activityCount) * 100 : 100;
  const totalTokens = activities.reduce((sum, a) => sum + (a.tokens_used || 0), 0);
  const avgTokensPerHour = totalTokens / 24;

  let streak = 0;
  const daysChecked = new Set<string>();

  for (const activity of [...weekActivities].reverse()) {
    const day = new Date(activity.timestamp).toDateString();
    if (daysChecked.has(day)) continue;
    daysChecked.add(day);

    const dayActivities = weekActivities.filter(
      (a) => new Date(a.timestamp).toDateString() === day
    );
    const hasCriticalError = dayActivities.some(
      (a) => a.status === "error" && (a.type === "system" || a.type === "security" || a.type === "build")
    );

    if (hasCriticalError) break;
    streak++;
  }

  let mood: MoodType;
  let score: number;

  if (criticalErrorCount >= 3 || successRate < 50) {
    mood = "frustrated";
    score = Math.max(0, 30 - criticalErrorCount * 10);
  } else if (activityCount === 0) {
    mood = "idle";
    score = 40;
  } else if (activityCount > 100 && successRate > 90) {
    mood = "productive";
    score = 90 + Math.min(10, streak);
  } else if (activityCount > 50) {
    mood = "busy";
    score = 70 + (successRate - 80) / 2;
  } else {
    mood = "neutral";
    score = 60;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    mood,
    emoji: MOOD_CONFIGS[mood].emoji,
    score,
    streak,
    metrics: {
      activityCount,
      successRate: Math.round(successRate * 10) / 10,
      avgTokensPerHour: Math.round(avgTokensPerHour),
      errorCount,
      criticalErrorCount,
    },
    description: MOOD_CONFIGS[mood].description,
  };
}

export async function GET() {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentResult = getActivities({
      startDate: last24h.toISOString(),
      limit: 1000,
      sort: "newest",
    });

    const weekResult = getActivities({
      startDate: last7days.toISOString(),
      limit: 5000,
      sort: "newest",
    });

    const mood = calculateMood(
      recentResult.activities as Array<{
        timestamp: string;
        status: string;
        type: string;
        tokens_used: number | null;
      }>,
      weekResult.activities as Array<{ timestamp: string; status: string; type: string }>
    );

    return NextResponse.json(mood);
  } catch (error) {
    console.error("Failed to calculate mood:", error);
    return NextResponse.json({ error: "Failed to calculate mood" }, { status: 500 });
  }
}
