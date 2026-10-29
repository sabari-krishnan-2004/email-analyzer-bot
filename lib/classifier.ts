import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { EmailCategory, EmailClassificationResult, EmailPriority } from "@/types";

const VALID_CATEGORIES: EmailCategory[] = [
  "Important",
  "Work",
  "Transactions",
  "Promotions",
  "Updates",
];

const VALID_PRIORITIES: EmailPriority[] = ["High", "Medium", "Low"];

/**
 * Initializes Google Generative AI client.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Rule-based heuristic fallback classification in case of API failure,
 * network outage, quota limit, or parsing anomaly.
 */
export function fallbackClassifyEmail(params: {
  sender: string;
  subject: string;
  content: string;
}): EmailClassificationResult {
  const combined = `${params.sender} ${params.subject} ${params.content}`.toLowerCase();

  let category: EmailCategory = "Updates";
  let priority: EmailPriority = "Low";
  let action_required = false;

  // Transactions detection
  if (
    combined.includes("receipt") ||
    combined.includes("invoice") ||
    combined.includes("order #") ||
    combined.includes("payment received") ||
    combined.includes("billed") ||
    combined.includes("statement") ||
    combined.includes("stripe") ||
    combined.includes("paypal") ||
    combined.includes("bank")
  ) {
    category = "Transactions";
    priority = "Medium";
  }
  // Promotions detection
  else if (
    combined.includes("discount") ||
    combined.includes("% off") ||
    combined.includes("sale") ||
    combined.includes("promo") ||
    combined.includes("deal") ||
    combined.includes("unsubscribe") ||
    combined.includes("newsletter")
  ) {
    category = "Promotions";
    priority = "Low";
  }
  // Work detection
  else if (
    combined.includes("project") ||
    combined.includes("meeting") ||
    combined.includes("sprint") ||
    combined.includes("pr ") ||
    combined.includes("pull request") ||
    combined.includes("jira") ||
    combined.includes("github") ||
    combined.includes("slack") ||
    combined.includes("deadline") ||
    combined.includes("client")
  ) {
    category = "Work";
    priority = "Medium";
  }
  // Important / Urgent detection
  if (
    combined.includes("urgent") ||
    combined.includes("action required") ||
    combined.includes("immediately") ||
    combined.includes("security alert") ||
    combined.includes("password reset") ||
    combined.includes("fraud alert") ||
    combined.includes("approval needed")
  ) {
    category = "Important";
    priority = "High";
    action_required = true;
  }

  // Action required cues
  if (
    combined.includes("action required") ||
    combined.includes("please review") ||
    combined.includes("confirm your") ||
    combined.includes("respond by") ||
    combined.includes("approval")
  ) {
    action_required = true;
  }

  const cleanSubject = params.subject.trim() || "Notification";
  const summary = `Email from ${params.sender.split("<")[0].trim()} regarding "${cleanSubject}". ${
    action_required ? "Review may be required." : "Categorized for your review."
  }`;

  return {
    category,
    priority,
    summary,
    action_required,
  };
}

/**
 * Classifies an individual email using Gemini 1.5 Flash with strict JSON response mode.
 */
export async function classifyEmail(params: {
  sender: string;
  subject: string;
  content: string;
}): Promise<EmailClassificationResult> {
  const { sender, subject, content } = params;

  // If no Gemini key is set, immediately use deterministic heuristic fallback
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured. Falling back to heuristic classifier.");
    return fallbackClassifyEmail(params);
  }

  try {
    const ai = getGeminiClient();

    // Use gemini-1.5-flash with application/json mimeType
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      systemInstruction: `You are an elite, highly accurate executive email triage AI.
Analyze the provided email sender, subject, and content.
You MUST output a valid JSON object matching this exact schema:
{
  "category": "Important" | "Work" | "Transactions" | "Promotions" | "Updates",
  "priority": "High" | "Medium" | "Low",
  "summary": "1-2 sentence concise summary highlighting key takeaways or action items",
  "action_required": true | false
}

Rules for Classification:
- category:
  - "Important": Urgent notices, direct executive requests, critical security alerts, deadlines, time-sensitive inquiries.
  - "Work": Team collaboration, GitHub/Jira/Slack updates, project deliverables, client correspondence.
  - "Transactions": Receipts, bank alerts, billing notifications, invoices, subscription charges.
  - "Promotions": Marketing offers, discounts, brand newsletters, retail deals.
  - "Updates": General social notifications, platform changelogs, system digests, community newsletters.
- priority:
  - "High": Demands immediate attention today or contains severe urgency.
  - "Medium": Needs review or response within the next few days.
  - "Low": Informational only, reading optional.
- summary: Exactly 1 to 2 crisp, insightful sentences. Never repeat the raw text verbatim. Focus on actionable outcome.
- action_required: true ONLY if the recipient must take a concrete action (reply, approve, pay, review, or verify). Otherwise false.
Output strictly JSON without markdown ticks.`,
    });

    const prompt = `Email Details:
From: ${sender}
Subject: ${subject}
Body Content:
${content || "(No email body text provided)"}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON safely
    const cleanJson = responseText
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    const parsed = JSON.parse(cleanJson);

    // Validate and sanitize parsed response
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? (parsed.category as EmailCategory)
      : "Updates";

    const priority = VALID_PRIORITIES.includes(parsed.priority)
      ? (parsed.priority as EmailPriority)
      : "Low";

    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : `Email from ${sender} regarding ${subject}.`;

    const action_required = Boolean(parsed.action_required);

    return {
      category,
      priority,
      summary,
      action_required,
    };
  } catch (error) {
    console.error("Gemini classification failed, using fallback:", error);
    return fallbackClassifyEmail(params);
  }
}
