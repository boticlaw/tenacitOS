import { NextRequest, NextResponse } from "next/server";
import { calculateCost, getModelName } from "@/lib/pricing";

export const dynamic = "force-dynamic";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  { id: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic", available: true },
  { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", available: true },
  { id: "anthropic/claude-haiku-3-5", name: "Claude Haiku 3.5", provider: "Anthropic", available: true },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", available: true },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", available: true },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", available: true },
];

interface CompareRequest {
  prompt: string;
  models: string[];
}

interface CompareResponse {
  modelId: string;
  modelName: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  responseTime: number;
  timestamp: string;
  error?: string;
}

function simulateModelResponse(prompt: string, modelId: string): { output: string; tokens: number } {
  const promptLength = prompt.length;
  const baseTokens = Math.ceil(promptLength / 4);
  
  const responses: Record<string, () => string> = {
    "anthropic/claude-opus-4-6": () => `**Claude Opus 4.6 Response**\n\nI've analyzed your prompt: "${prompt.slice(0, 50)}..."\n\nThis is a comprehensive analysis with detailed reasoning. Opus excels at complex tasks requiring deep understanding and nuanced responses.\n\nKey points:\n- Point 1: Analysis\n- Point 2: Synthesis\n- Point 3: Recommendations`,
    
    "anthropic/claude-sonnet-4-5": () => `**Claude Sonnet 4.5 Response**\n\nBased on: "${prompt.slice(0, 50)}..."\n\nHere's my balanced response that combines quality with efficiency. Sonnet provides excellent performance for most tasks.\n\nSummary:\n1. Main insight\n2. Supporting detail\n3. Action item`,
    
    "anthropic/claude-haiku-3-5": () => `**Claude Haiku 3.5 Response**\n\nQuick response to: "${prompt.slice(0, 50)}..."\n\nHaiku delivers fast, efficient answers for straightforward tasks.\n\n- Fast\n- Efficient\n- Cost-effective`,
    
    "google/gemini-2.0-flash": () => `**Gemini 2.0 Flash Response**\n\nProcessing: "${prompt.slice(0, 50)}..."\n\nGemini Flash provides quick responses with Google's AI capabilities.\n\n• Rapid processing\n• Google integration\n• Multimodal ready`,
    
    "openai/gpt-4o": () => `**GPT-4o Response**\n\nAnalyzing: "${prompt.slice(0, 50)}..."\n\nGPT-4o delivers versatile AI assistance across various tasks.\n\n→ Comprehensive\n→ Versatile\n→ Reliable`,
    
    "openai/gpt-4o-mini": () => `**GPT-4o Mini Response**\n\nQuick take on: "${prompt.slice(0, 50)}..."\n\nEfficient and fast responses for everyday tasks.\n\n- Lightweight\n- Quick\n- Affordable`,
  };
  
  const output = responses[modelId]?.() || `Response from ${modelId} for: ${prompt.slice(0, 50)}...`;
  const outputTokens = Math.ceil(output.length / 4);
  
  return { output, tokens: baseTokens + outputTokens };
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json();
    const { prompt, models } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!models || models.length < 2) {
      return NextResponse.json({ error: "At least 2 models are required" }, { status: 400 });
    }

    const responses: CompareResponse[] = await Promise.all(
      models.map(async (modelId) => {
        const startTime = Date.now();
        const model = AVAILABLE_MODELS.find((m) => m.id === modelId);

        if (!model) {
          return {
            modelId,
            modelName: modelId,
            output: "",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            responseTime: 0,
            timestamp: new Date().toISOString(),
            error: "Model not found",
          };
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 500));
          
          const { output, tokens } = simulateModelResponse(prompt, modelId);
          const inputTokens = Math.ceil(prompt.length / 4);
          const outputTokens = tokens - inputTokens;
          const responseTime = Date.now() - startTime;
          const cost = calculateCost(modelId, inputTokens, outputTokens);

          return {
            modelId,
            modelName: getModelName(modelId),
            output,
            inputTokens,
            outputTokens,
            totalTokens: tokens,
            cost,
            responseTime,
            timestamp: new Date().toISOString(),
          };
        } catch {
          return {
            modelId,
            modelName: model.name,
            output: "",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            error: "Failed to get response",
          };
        }
      })
    );

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("[playground/compare] Error:", error);
    return NextResponse.json({ error: "Failed to compare models" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
