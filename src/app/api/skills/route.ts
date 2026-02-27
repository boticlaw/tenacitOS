import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { scanAllSkills } from "@/lib/skill-parser";

const DATA_DIR = path.join(process.cwd(), "data");
const DISABLED_SKILLS_PATH = path.join(DATA_DIR, "disabled-skills.json");

function getDisabledSkills(): string[] {
  try {
    if (fs.existsSync(DISABLED_SKILLS_PATH)) {
      const content = fs.readFileSync(DISABLED_SKILLS_PATH, "utf-8");
      const data = JSON.parse(content);
      return data.disabled || [];
    }
  } catch {
    // Ignore errors
  }
  return [];
}

export async function GET() {
  try {
    const skills = scanAllSkills();
    const disabledSkills = getDisabledSkills();

    const skillsWithStatus = skills.map((skill) => ({
      ...skill,
      enabled: !disabledSkills.includes(skill.id),
    }));

    return NextResponse.json({
      skills: skillsWithStatus,
    });
  } catch (error) {
    console.error("Failed to scan skills:", error);
    return NextResponse.json({ skills: [] }, { status: 500 });
  }
}
