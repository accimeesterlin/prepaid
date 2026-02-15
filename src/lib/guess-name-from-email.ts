/* eslint-disable @typescript-eslint/no-require-imports */
const WordsNinja = require("wordsninja");
const humanNames = require("human-names");

import { capitalCase } from "change-case";

// ---- WordsNinja singleton (requires async init) ----
let ninjaInstance: InstanceType<typeof WordsNinja> | null = null;
let ninjaReady = false;

async function getNinja(): Promise<InstanceType<typeof WordsNinja>> {
  if (!ninjaInstance) {
    ninjaInstance = new WordsNinja();
  }
  if (!ninjaReady) {
    await ninjaInstance.loadDictionary();
    ninjaReady = true;
  }
  return ninjaInstance;
}

// ---- Name dictionaries (lowercased) ----
const nameArrays: string[][] = [
  humanNames.allFr ?? [],
  humanNames.allEs ?? [],
  humanNames.allEn ?? [],
  humanNames.allIt ?? [],
  humanNames.allDe ?? [],
  humanNames.allNl ?? [],
];
const allNamesSet = new Set(
  nameArrays.flatMap((arr: string[]) => arr.map((s: string) => s.toLowerCase())),
);

const isNameHit = (t: string): boolean => allNamesSet.has(t);

// ---- Strong "not a person" / role / brand keywords ----
const BLOCKLIST_WORDS = new Set([
  "shop",
  "store",
  "boutique",
  "market",
  "mall",
  "sales",
  "support",
  "admin",
  "info",
  "contact",
  "help",
  "billing",
  "service",
  "team",
  "official",
  "group",
  "page",
  "media",
  "news",
  "tv",
  "radio",
  "promo",
  "marketing",
  "dj",
  "mix",
  "music",
  "sound",
  "studio",
  "records",
  "label",
  "crypto",
  "pay",
  "wallet",
  "exchange",
  "p2p",
  "trading",
]);

// ---- Nickname-y words (drop them if they appear) ----
const NICKNAME_WORDS = new Set([
  "hero",
  "king",
  "queen",
  "boss",
  "legend",
  "chief",
  "prince",
  "princess",
  "god",
  "goddess",
  "real",
  "big",
  "mr",
  "mrs",
]);

// ---- Tiny noise suffixes often appended ----
const TRAILING_NOISE = new Set([
  "pf",
  "jr",
  "sr",
  "ht",
  "dr",
  "tv",
  "rd",
  "st",
  "nd",
  "th",
  "xx",
  "x",
]);

function digitPenalty(localOriginal: string): number {
  const digits = localOriginal.match(/\d/g)?.length ?? 0;
  if (digits === 0) return 0;

  const ratio = digits / Math.max(localOriginal.length, 1);
  if (ratio >= 0.25) return 0.65;
  if (digits >= 3) return 0.55;
  if (digits === 2) return 0.45;
  return 0.3;
}

function looksLikeBrandOrRole(tokensLower: string[]): boolean {
  return tokensLower.some((t) => BLOCKLIST_WORDS.has(t));
}

function scoreToken(t: string): number {
  if (!t) return -10;
  if (t.length <= 1) return -6;
  if (!/^[a-z]+$/.test(t)) return -3;

  let score = 0;

  if (allNamesSet.has(t)) score += 6;
  if (t.length >= 3 && t.length <= 12) score += 1;
  if (BLOCKLIST_WORDS.has(t)) score -= 20;
  if (NICKNAME_WORDS.has(t)) score -= 4;

  return score;
}

function cleanupLocal(localOriginal: string): string {
  let local = localOriginal.trim().toLowerCase();
  local = local.split("+")[0];
  local = local.replace(/[._-]+/g, " ");
  return local;
}

function dropTrailingNoise(tokens: string[]): string[] {
  const result = [...tokens];
  while (result.length) {
    const last = result[result.length - 1];
    const lower = last.toLowerCase();

    if (TRAILING_NOISE.has(lower)) {
      result.pop();
      continue;
    }

    if (lower.length <= 2 && !isNameHit(lower)) {
      result.pop();
      continue;
    }

    break;
  }
  return result;
}

function dropNicknames(tokens: string[]): string[] {
  return tokens.filter((t) => !NICKNAME_WORDS.has(t.toLowerCase()));
}

function removeLeadingInitial(tokens: string[]): string[] {
  if (tokens.length >= 2 && tokens[0].length === 1) return tokens.slice(1);
  return tokens;
}

async function tokenize(localClean: string): Promise<string[]> {
  let tokens: string[];

  if (localClean.includes(" ")) {
    tokens = localClean.split(" ").filter(Boolean);
  } else {
    const ninja = await getNinja();
    tokens = ninja.splitSentence(localClean) as string[];
  }

  tokens = tokens.map((t: string) => t.replace(/\d+/g, "")).filter(Boolean);
  return tokens;
}

function shouldAvoidOverSplit(tokens: string[]): boolean {
  const hits = tokens.filter((t) => isNameHit(t.toLowerCase())).length;
  return tokens.length >= 2 && hits === 0;
}

function joinAsSingleToken(tokens: string[]): string[] {
  return [tokens.join("")];
}

export type GuessDecision = "autofill" | "suggest" | "blank";

export interface NameGuessResult {
  guessedName: string | null;
  confidence: number;
  decision: GuessDecision;
  tokens: string[];
  reason: string;
}

/**
 * Guess a person's name from an email address.
 *
 * Returns a confidence score (0-1) and a decision:
 * - "autofill": high confidence (>=0.75), safe to use
 * - "suggest": medium confidence (>=0.50), show for review
 * - "blank": low confidence, don't suggest
 */
export async function guessNameFromEmail(
  email: string,
): Promise<NameGuessResult> {
  const out: NameGuessResult = {
    guessedName: null,
    confidence: 0,
    decision: "blank",
    tokens: [],
    reason: "",
  };

  if (!email || !email.includes("@")) return out;

  const localOriginal = email.split("@")[0];
  const localClean = cleanupLocal(localOriginal);

  let tokens = await tokenize(localClean);

  const isBrandOrRole = looksLikeBrandOrRole(
    tokens.map((t) => t.toLowerCase()),
  );

  if (isBrandOrRole) {
    // Still produce a guess but with very low confidence
    const cleaned = tokens.filter(
      (t) => !BLOCKLIST_WORDS.has(t.toLowerCase()),
    );
    if (cleaned.length > 0) {
      out.tokens = cleaned;
      out.guessedName = capitalCase(cleaned.join(" "));
      out.confidence = 0.1;
      out.decision = "blank";
      out.reason = "brand/role keywords detected — low confidence";
      return out;
    }
    out.reason = "brand/role keywords only";
    return out;
  }

  if (shouldAvoidOverSplit(tokens)) {
    const nameish = tokens.filter(
      (t) => /^[a-z]+$/i.test(t) && t.length >= 3 && t.length <= 12,
    );
    tokens = nameish.length >= 2 ? nameish : joinAsSingleToken(tokens);
    out.reason = "avoided oversplitting (no dictionary hits)";
  } else {
    out.reason = "segmented + dictionary hits";
  }

  tokens = removeLeadingInitial(tokens);
  tokens = dropTrailingNoise(tokens);
  tokens = dropNicknames(tokens);

  if (!tokens.length) {
    // Fallback: use the cleaned local part as-is
    const fallbackTokens = localClean
      .split(" ")
      .filter(Boolean)
      .map((t) => t.replace(/\d+/g, ""))
      .filter((t) => t.length >= 2);
    if (fallbackTokens.length > 0) {
      out.tokens = fallbackTokens;
      out.guessedName = capitalCase(fallbackTokens.join(" "));
      out.confidence = 0.1;
      out.decision = "blank";
      out.reason = "fallback from cleaned local part";
    }
    return out;
  }

  if (looksLikeBrandOrRole(tokens.map((t) => t.toLowerCase()))) {
    const cleaned = tokens.filter(
      (t) => !BLOCKLIST_WORDS.has(t.toLowerCase()),
    );
    if (cleaned.length > 0) {
      out.tokens = cleaned;
      out.guessedName = capitalCase(cleaned.join(" "));
      out.confidence = 0.1;
      out.decision = "blank";
      out.reason = "brand/role keywords detected (post-cleanup)";
      return out;
    }
    out.reason = "brand/role keywords only (post-cleanup)";
    return out;
  }

  const totalScore = tokens.reduce(
    (sum, t) => sum + scoreToken(t.toLowerCase()),
    0,
  );
  const maxScore = Math.max(tokens.length * 6, 1);
  let confidence = Math.max(0, Math.min(1, totalScore / maxScore));

  confidence = Math.max(0, confidence - digitPenalty(localOriginal));

  if (tokens.length === 1 && !isNameHit(tokens[0].toLowerCase())) {
    confidence = Math.min(confidence, 0.35);
  }

  // Ensure a minimum confidence so guesses always surface for review
  confidence = Math.max(0.1, confidence);

  out.tokens = tokens;
  out.guessedName = capitalCase(tokens.join(" "));
  out.confidence = Number(confidence.toFixed(2));

  if (out.confidence >= 0.75) out.decision = "autofill";
  else if (out.confidence >= 0.5) out.decision = "suggest";
  else out.decision = "blank";

  return out;
}
