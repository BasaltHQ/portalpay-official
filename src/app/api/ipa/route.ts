import { NextResponse } from "next/server";
// @ts-expect-error - library ships untyped JS map
import ipaDictRaw from "ipa-dict/en_US";

let ipaMap: Map<string, string[]> | null = null;

function ensureIpaMap(): Map<string, string[]> {
  if (ipaMap) return ipaMap;
  const source: any = (ipaDictRaw as any)?.default ?? ipaDictRaw;
  if (source instanceof Map) {
    ipaMap = source;
  } else if (source && typeof source === "object") {
    ipaMap = new Map(Object.entries(source as Record<string, string[]>));
  } else {
    ipaMap = new Map();
  }
  return ipaMap!;
}

function replaceWordWithIpa(text: string): string {
  const dict = ensureIpaMap();
  return text.replace(/([A-Za-z][A-Za-z'\-]*)/g, (match) => {
    const key = match.toLowerCase();
    const entry = dict.get(key);
    if (!entry || entry.length === 0) return match;
    const ipa = entry[0];
    return typeof ipa === "string" && ipa.trim() ? ipa.trim() : match;
  });
}

function getOptionsForWord(word: string): string[] {
  const dict = ensureIpaMap();
  const entry = dict.get(word.toLowerCase());
  if (!entry) return [];
  const cleaned = entry
    .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
    .filter((opt) => opt.length > 0);
  return Array.from(new Set(cleaned));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rawText = typeof body?.text === "string" ? body.text : "";
    if (!rawText.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const normalized = rawText.replace(/\u2019/g, "'");
    const ipa = replaceWordWithIpa(normalized);

    let options: string[] = [];
    const trimmed = normalized.trim();
    if (/^[A-Za-z'\-]+$/.test(trimmed)) {
      options = getOptionsForWord(trimmed);
    }

    return NextResponse.json({ ipa, options });
  } catch (error) {
    return NextResponse.json({ error: "Unable to convert to IPA" }, { status: 500 });
  }
}