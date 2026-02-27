import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(process.env.HOME || "/root", ".openclaw");
const DATA_DIR = path.join(process.cwd(), "data");

const OUTBOX_PATHS = [
  path.join(OPENCLAW_DIR, "logs/outbox.jsonl"),
  path.join(DATA_DIR, "outbox.json"),
];

interface OutboxMessage {
  id: string;
  timestamp: string;
  channel: string;
  type: string;
  recipient: string;
  subject?: string;
  content: string;
  contentPreview: string;
  status: string;
  error?: string;
  metadata?: {
    messageId?: string;
    responseTime?: number;
    retryCount?: number;
  };
}

interface OutboxResponse {
  messages: OutboxMessage[];
  total: number;
  filters: {
    channel?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function normalizeMessage(raw: Record<string, unknown>): OutboxMessage | null {
  if (!raw) return null;

  const content = String(raw.content || raw.message || raw.body || "");
  const recipient = String(raw.recipient || raw.chatId || raw.to || raw.email || "unknown");

  return {
    id: String(raw.id || raw.timestamp || Date.now()),
    timestamp: String(raw.timestamp || raw.sentAt || new Date().toISOString()),
    channel: String(raw.channel || raw.platform || "unknown").toLowerCase(),
    type: String(raw.type || "notification").toLowerCase(),
    recipient,
    subject: raw.subject ? String(raw.subject) : undefined,
    content,
    contentPreview: content.slice(0, 150) + (content.length > 150 ? "..." : ""),
    status: String(raw.status || "sent").toLowerCase(),
    error: raw.error ? String(raw.error) : undefined,
    metadata: raw.metadata as OutboxMessage["metadata"],
  };
}

function readJsonlFile(filePath: string): OutboxMessage[] {
  if (!fs.existsSync(filePath)) return [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    return lines
      .map((line) => {
        try {
          const data = JSON.parse(line);
          return normalizeMessage(data);
        } catch {
          return null;
        }
      })
      .filter((m): m is OutboxMessage => m !== null);
  } catch {
    return [];
  }
}

function readJsonFile(filePath: string): OutboxMessage[] {
  if (!fs.existsSync(filePath)) return [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      return data
        .map((item) => normalizeMessage(item))
        .filter((m): m is OutboxMessage => m !== null);
    }

    const normalized = normalizeMessage(data);
    return normalized ? [normalized] : [];
  } catch {
    return [];
  }
}

function readAllOutboxMessages(): OutboxMessage[] {
  const allMessages: OutboxMessage[] = [];
  const seenIds = new Set<string>();

  for (const outboxPath of OUTBOX_PATHS) {
    let messages: OutboxMessage[] = [];

    if (outboxPath.endsWith(".jsonl")) {
      messages = readJsonlFile(outboxPath);
    } else {
      messages = readJsonFile(outboxPath);
    }

    for (const msg of messages) {
      if (!seenIds.has(msg.id)) {
        seenIds.add(msg.id);
        allMessages.push(msg);
      }
    }
  }

  return allMessages;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const channel = searchParams.get("channel");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    let messages = readAllOutboxMessages();

    if (channel) {
      messages = messages.filter((m) => m.channel === channel.toLowerCase());
    }
    if (type) {
      messages = messages.filter((m) => m.type === type.toLowerCase());
    }
    if (status) {
      messages = messages.filter((m) => m.status === status.toLowerCase());
    }
    if (startDate) {
      messages = messages.filter((m) => new Date(m.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      messages = messages.filter((m) => new Date(m.timestamp) <= end);
    }

    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = messages.length;
    const paginated = messages.slice(offset, offset + limit);

    const response: OutboxResponse = {
      messages: paginated,
      total,
      filters: {
        channel: channel || undefined,
        type: type || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to read outbox:", error);
    return NextResponse.json(
      {
        messages: [],
        total: 0,
        error: "Failed to read notifications outbox",
        filters: {},
        pagination: { limit: 50, offset: 0, hasMore: false },
      },
      { status: 500 }
    );
  }
}
