import { NextResponse } from "next/server";
import { MODEL_PRICING } from "@/lib/pricing";

export const dynamic = "force-dynamic";

interface Model {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

export async function GET() {
  const models: Model[] = MODEL_PRICING.map((m) => {
    const provider = m.id.split("/")[0] || "unknown";
    return {
      id: m.id,
      name: m.name,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      available: true,
    };
  });

  return NextResponse.json(models);
}
