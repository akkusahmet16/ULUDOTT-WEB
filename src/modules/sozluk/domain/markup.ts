import { toSozlukSlug } from "./slug.ts";

export type SozlukMarkupToken =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "bkz"; readonly target: string; readonly slug: string }
  | {
      readonly type: "hidden_bkz";
      readonly target: string;
      readonly slug: string;
    }
  | { readonly type: "link"; readonly url: string; readonly label: string }
  | { readonly type: "mention"; readonly nick: string };

const TOKEN_PATTERN =
  /(\(bkz:\s*([^()\n]{1,100}?)\)|`([^`\n]{1,100}?)`|\[(https?:\/\/[^\s\]]+)\s+([^\]\n]{1,120})\]|(?<=^|[\s(])@([a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]{3,24}))/g;

function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseSozlukMarkup(content: string): SozlukMarkupToken[] {
  const tokens: SozlukMarkupToken[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, index) });
    }

    const full = match[0];
    const bkzTarget = match[2];
    const hiddenBkzTarget = match[3];
    const linkUrl = match[4];
    const linkLabel = match[5];
    const mentionNick = match[6];

    if (bkzTarget !== undefined) {
      const target = bkzTarget.trim();
      const slug = toSozlukSlug(target);
      if (target.length > 0 && slug.length > 0) {
        tokens.push({ type: "bkz", target, slug });
      } else {
        tokens.push({ type: "text", value: full });
      }
    } else if (hiddenBkzTarget !== undefined) {
      const target = hiddenBkzTarget.trim();
      const slug = toSozlukSlug(target);
      if (target.length > 0 && slug.length > 0) {
        tokens.push({ type: "hidden_bkz", target, slug });
      } else {
        tokens.push({ type: "text", value: full });
      }
    } else if (linkUrl !== undefined && linkLabel !== undefined) {
      if (isSafeHttpUrl(linkUrl)) {
        tokens.push({
          type: "link",
          url: linkUrl,
          label: linkLabel.trim() || linkUrl,
        });
      } else {
        tokens.push({ type: "text", value: full });
      }
    } else if (mentionNick !== undefined) {
      tokens.push({
        type: "mention",
        nick: mentionNick.toLocaleLowerCase("tr-TR"),
      });
    } else {
      tokens.push({ type: "text", value: full });
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}

export function extractBkzTargets(content: string): string[] {
  const targets = new Set<string>();
  for (const token of parseSozlukMarkup(content)) {
    if (token.type === "bkz" || token.type === "hidden_bkz") {
      targets.add(token.target);
    }
  }
  return Array.from(targets);
}
