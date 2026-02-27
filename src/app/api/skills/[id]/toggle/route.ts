import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const DISABLED_SKILLS_PATH = path.join(DATA_DIR, "disabled-skills.json");

interface DisabledSkillsData {
  disabled: string[];
  updatedAt?: string;
}

function readDisabledSkills(): string[] {
  if (!fs.existsSync(DISABLED_SKILLS_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(DISABLED_SKILLS_PATH, "utf-8");
    const data = JSON.parse(content) as DisabledSkillsData;
    return data.disabled || [];
  } catch {
    return [];
  }
}

function writeDisabledSkills(disabled: string[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(
    DISABLED_SKILLS_PATH,
    JSON.stringify({ disabled, updatedAt: new Date().toISOString() }, null, 2)
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skillId = decodeURIComponent(id);
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Missing 'enabled' boolean in request body" }, { status: 400 });
    }

    const disabled = readDisabledSkills();
    const isCurrentlyDisabled = disabled.includes(skillId);

    let newDisabled: string[];

    if (enabled && isCurrentlyDisabled) {
      newDisabled = disabled.filter((id) => id !== skillId);
    } else if (!enabled && !isCurrentlyDisabled) {
      newDisabled = [...disabled, skillId];
    } else {
      newDisabled = disabled;
    }

    writeDisabledSkills(newDisabled);

    return NextResponse.json({
      skillId,
      enabled,
      message: enabled ? "Skill enabled" : "Skill disabled",
    });
  } catch (error) {
    console.error("Failed to toggle skill:", error);
    return NextResponse.json({ error: "Failed to toggle skill" }, { status: 500 });
  }
}
