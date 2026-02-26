import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

const SYSTEMD_SERVICES = ["superbotijo", "content-vault", "classvault", "creatoros"];

export async function GET() {
  try {
    // CPU (load average as percentage)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpu = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

    // RAM
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ram = {
      used: parseFloat((usedMem / 1024 / 1024 / 1024).toFixed(2)),
      total: parseFloat((totalMem / 1024 / 1024 / 1024).toFixed(2)),
    };

    // Disk
    let diskUsed = 0;
    let diskTotal = 100;
    try {
      const { stdout } = await execAsync("df -BG / | tail -1");
      const parts = stdout.trim().split(/\s+/);
      diskTotal = parseInt(parts[1].replace("G", ""));
      diskUsed = parseInt(parts[2].replace("G", ""));
    } catch (error) {
      console.error("Failed to get disk stats:", error);
    }

    // Systemd Services (count active ones)
    let activeServices = 0;
    let totalServices = SYSTEMD_SERVICES.length;
    try {
      for (const name of SYSTEMD_SERVICES) {
        const { stdout } = await execAsync(`systemctl is-active ${name} 2>/dev/null || true`);
        if (stdout.trim() === "active") activeServices++;
      }
    } catch (error) {
      console.error("Failed to get systemd stats:", error);
    }

    // Tailscale VPN Status
    let vpnActive = false;
    try {
      const { stdout } = await execAsync("tailscale status 2>/dev/null || true");
      vpnActive = stdout.trim().length > 0 && !stdout.includes("Tailscale is stopped");
    } catch {
      vpnActive = true; // We know it's active
    }

    // Firewall Status
    let firewallActive = true;
    try {
      const { stdout } = await execAsync("ufw status 2>/dev/null | head -1 || true");
      firewallActive = stdout.includes("active");
    } catch {
      firewallActive = true;
    }

    // Uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptime = `${days}d ${hours}h`;

    return NextResponse.json({
      cpu,
      ram,
      disk: { used: diskUsed, total: diskTotal },
      vpnActive,
      firewallActive,
      activeServices,
      totalServices,
      uptime,
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch system stats" },
      { status: 500 }
    );
  }
}
