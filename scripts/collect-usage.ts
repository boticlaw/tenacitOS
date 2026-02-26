#!/usr/bin/env tsx
/**
 * Collect Usage Script
 * 
 * Collects current OpenClaw usage data and stores it in SQLite
 * Run manually or via cron
 */

import path from "path";
import { collectUsage } from "../src/lib/usage-collector";

const DB_PATH = path.join(__dirname, "..", "data", "usage-tracking.db");

async function main() {
  console.log("🦞 SuperBotijo - Usage Collector");
  console.log(`Database: ${DB_PATH}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log();

  try {
    await collectUsage(DB_PATH);
    console.log("✅ Usage data collected successfully");
  } catch (error) {
    console.error("❌ Error collecting usage data:", error);
    process.exit(1);
  }
}

main();
