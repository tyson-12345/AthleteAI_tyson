import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Atlas, an elite AI sports performance coach built into AthleteAI. You have deep expertise in biomechanics, sports science, injury prevention, and athletic performance across all sports.

Your coaching style:
- Data-driven and specific — reference scores, joint angles, and analysis results by name when available
- Encouraging but honest; never sugarcoat form issues that could lead to injury
- Practical — every response ends with a concrete drill, cue, or next step the athlete can execute today
- Concise — 2-4 paragraphs unless the athlete explicitly asks for a detailed breakdown

When the athlete shares analysis data, reference it specifically (e.g. "Your balance score of 72 suggests…"). If scores are missing, ask what sport and movement they're working on before advising. Do not give generic advice — be sport-specific and movement-specific at all times.`;

export async function chatWithCoach(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: {
    sport?: string;
    level?: string;
    recentAnalysis?: {
      title: string;
      scores: Record<string, number>;
      strengths: string[];
      improvements: string[];
    };
  }
): Promise<string> {
  let systemWithContext = SYSTEM_PROMPT;

  if (context) {
    systemWithContext += `\n\nAthlete context:\n- Sport: ${context.sport ?? "unknown"}\n- Level: ${context.level ?? "unknown"}`;

    if (context.recentAnalysis) {
      const { title, scores, strengths, improvements } = context.recentAnalysis;
      const scoreLines = Object.entries(scores)
        .map(([k, v]) => `  • ${k}: ${Math.round(v)}/100`)
        .join("\n");
      systemWithContext += `\n\nMost recent analysis: "${title}"\nPerformance scores:\n${scoreLines}`;
      if (strengths.length) systemWithContext += `\nStrengths: ${strengths.slice(0, 3).join("; ")}`;
      if (improvements.length) systemWithContext += `\nTop areas to improve: ${improvements.slice(0, 3).join("; ")}`;
    }
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

export async function generateAnalysis(input: {
  sport: string;
  title: string;
  level: string;
  duration: number;
  jointAngles?: Record<string, number>;
  goals?: string[];
  injuryConcerns?: string[];
}): Promise<{
  scores: {
    overall: number;
    technique: number;
    power: number;
    balance: number;
    consistency: number;
    mobility: number;
    speed: number;
  };
  strengths: string[];
  improvements: string[];
  tips: {
    category: string;
    severity: string;
    title: string;
    description: string;
    drill: string;
  }[];
  injuryRisks: {
    joint: string;
    riskPercent: number;
    description: string;
    prevention: string;
  }[];
}> {
  const jointContext = input.jointAngles
    ? `\nDetected joint angles from pose tracking: ${JSON.stringify(input.jointAngles)}`
    : "";
  const goalsContext = input.goals?.length ? `\nAthlete goals: ${input.goals.join(", ")}` : "";
  const injuryContext = input.injuryConcerns?.length
    ? `\nKnown injury concerns: ${input.injuryConcerns.join(", ")}`
    : "";

  const prompt = `You are an elite sports biomechanics analyst. Analyze a ${input.sport} training session titled "${input.title}" for a ${input.level}-level athlete. Session duration: ${input.duration}s.${jointContext}${goalsContext}${injuryContext}

Produce a realistic, sport-specific analysis. Scores must reflect genuine variation — not all athletes score in the same range. A beginner may score 40-65, intermediate 55-78, advanced 70-90. Vary individual scores meaningfully to reflect actual ${input.sport} performance patterns.

Return ONLY a valid JSON object (no markdown, no code blocks, no commentary) with this exact structure:
{
  "scores": {
    "overall": <integer>,
    "technique": <integer>,
    "power": <integer>,
    "balance": <integer>,
    "consistency": <integer>,
    "mobility": <integer>,
    "speed": <integer>
  },
  "strengths": [
    "<specific, ${input.sport}-relevant strength observed>",
    "<second specific strength>",
    "<third specific strength>"
  ],
  "improvements": [
    "<specific, actionable improvement with biomechanical detail>",
    "<second improvement>",
    "<third improvement>"
  ],
  "tips": [
    {
      "category": "<technique|injury-risk|mobility|strength|conditioning>",
      "severity": "<info|warning|critical>",
      "title": "<concise title under 8 words>",
      "description": "<2-3 sentences: what the issue is, why it matters biomechanically, what it looks like in ${input.sport}>",
      "drill": "<specific drill with exercise name, sets, reps, and coaching cue>"
    },
    { "category": "...", "severity": "...", "title": "...", "description": "...", "drill": "..." },
    { "category": "...", "severity": "...", "title": "...", "description": "...", "drill": "..." }
  ],
  "injuryRisks": [
    {
      "joint": "<specific joint or muscle group>",
      "riskPercent": <integer 10-70>,
      "description": "<why this is at risk in ${input.sport} for this movement pattern>",
      "prevention": "<specific prevention exercise or cue with sets/reps>"
    },
    {
      "joint": "...",
      "riskPercent": <integer>,
      "description": "...",
      "prevention": "..."
    }
  ]
}`;

  return withRetry(() => callGenerateAnalysis(prompt));
}

async function callGenerateAnalysis(prompt: string): Promise<ReturnType<typeof generateAnalysis>> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") throw new Error("Unexpected response type from Claude");

  let text = block.text.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in Claude response");
  text = text.slice(start, end + 1);

  const parsed = JSON.parse(text);
  return validateAndClampAnalysis(parsed);
}

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Math.min(100, Math.max(0, Math.round(isNaN(n) ? 0 : n)));
}

function validateAndClampAnalysis(raw: unknown): {
  scores: { overall: number; technique: number; power: number; balance: number; consistency: number; mobility: number; speed: number };
  strengths: string[];
  improvements: string[];
  tips: { category: string; severity: string; title: string; description: string; drill: string }[];
  injuryRisks: { joint: string; riskPercent: number; description: string; prevention: string }[];
} {
  if (typeof raw !== "object" || raw === null) throw new Error("Invalid analysis response shape");
  const r = raw as Record<string, unknown>;
  const s = (r.scores ?? {}) as Record<string, unknown>;

  return {
    scores: {
      overall: clampScore(s.overall),
      technique: clampScore(s.technique),
      power: clampScore(s.power),
      balance: clampScore(s.balance),
      consistency: clampScore(s.consistency),
      mobility: clampScore(s.mobility),
      speed: clampScore(s.speed),
    },
    strengths: Array.isArray(r.strengths) ? (r.strengths as string[]).slice(0, 5) : [],
    improvements: Array.isArray(r.improvements) ? (r.improvements as string[]).slice(0, 5) : [],
    tips: Array.isArray(r.tips) ? (r.tips as Record<string, unknown>[]).slice(0, 6).map((t) => ({
      category: String(t.category ?? "technique"),
      severity: String(t.severity ?? "info"),
      title: String(t.title ?? ""),
      description: String(t.description ?? ""),
      drill: String(t.drill ?? ""),
    })) : [],
    injuryRisks: Array.isArray(r.injuryRisks) ? (r.injuryRisks as Record<string, unknown>[]).slice(0, 4).map((risk) => ({
      joint: String(risk.joint ?? ""),
      riskPercent: clampScore(risk.riskPercent),
      description: String(risk.description ?? ""),
      prevention: String(risk.prevention ?? ""),
    })) : [],
  };
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("529") ||
          err.message.includes("overloaded") ||
          err.message.includes("rate_limit") ||
          err.message.includes("timeout") ||
          err.message.includes("ECONNRESET"));
      if (!isRetryable || attempt === maxAttempts) break;
      await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
  throw lastErr;
}
