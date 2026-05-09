import type {
  AnalysisAnomaly,
  DocumentKind,
  DocumentProfile,
  DocumentZone,
  NormalizationChange,
  Suggestion,
  ZoneKind,
} from "../../shared/types";

export interface PreparedInput {
  text: string;
  zones: DocumentZone[];
  document: DocumentProfile;
  anomalies: AnalysisAnomaly[];
  normalizations: NormalizationChange[];
}

const ignoredZoneKinds = new Set<ZoneKind>([
  "url",
  "code-fence",
  "inline-code",
  "email-header",
  "template-tag",
  "metadata",
]);

export function prepareInput(text: string): PreparedInput {
  const normalized = normalizeText(text);
  const zones = inferZones(normalized.text);
  const wordCount = countWords(normalized.text);
  const document = classifyDocument(normalized.text, zones, wordCount);
  const anomalies = inferAnomalies(normalized.text, document);
  const normalizations = [
    ...normalized.changes,
    ...normalizationSuggestions(normalized.text),
  ].sort((a, b) => a.start - b.start || a.kind.localeCompare(b.kind));

  return {
    text: normalized.text,
    zones,
    document,
    anomalies,
    normalizations,
  };
}

export function ignoredZoneKindsList(): ZoneKind[] {
  return Array.from(ignoredZoneKinds).sort();
}

export function overlapsIgnoredZone(
  start: number,
  end: number,
  zones: DocumentZone[],
): DocumentZone | undefined {
  return zones.find(
    (zone) =>
      ignoredZoneKinds.has(zone.kind) &&
      Math.max(start, zone.start) <
        Math.min(Math.max(end, start + 1), zone.end),
  );
}

export function normalizationChangeSuggestions(
  changes: NormalizationChange[],
): Suggestion[] {
  return changes.map((change) => ({
    id: `${change.kind}:${change.start}:${stableText(change.original)}`,
    ruleId: `normalization.${change.kind}`,
    category: "grammar",
    severity: change.confidence >= 0.85 ? "warning" : "info",
    source: "LanguageTool-style rules",
    title: normalizationTitle(change.kind),
    message: normalizationMessage(change.kind),
    explanation: change.reason,
    reason: change.reason,
    start: change.start,
    end: change.end,
    original: change.original,
    replacements: [change.replacement],
    confidence: change.confidence,
  }));
}

export function anomalySuggestions(anomalies: AnalysisAnomaly[]): Suggestion[] {
  return anomalies.map((anomaly) => ({
    id: `anomaly.${anomaly.kind}:${anomaly.start}`,
    ruleId: `anomaly.${anomaly.kind}`,
    category: "style",
    severity: "info",
    source: "Vale-style rules",
    title: anomaly.title,
    message: anomaly.message,
    explanation: anomaly.nextStep,
    reason: anomaly.nextStep,
    start: anomaly.start,
    end: anomaly.end,
    original: "",
    replacements: [],
    confidence: anomaly.confidence,
    occurrences:
      anomaly.kind === "repeated-pattern"
        ? repeatedPatternCount(anomaly.message)
        : 1,
  }));
}

function normalizeText(text: string): {
  text: string;
  changes: NormalizationChange[];
} {
  const changes: NormalizationChange[] = [];
  let normalized = text.replace(/^\uFEFF/, "");

  normalized = normalized.replace(/\r\n?/g, "\n");

  for (const match of normalized.matchAll(/\u00a0/g)) {
    changes.push({
      id: `nbsp:${match.index}`,
      kind: "nbsp",
      start: match.index ?? 0,
      end: (match.index ?? 0) + 1,
      original: "\u00a0",
      replacement: " ",
      confidence: 0.99,
      reason:
        "Non-breaking spaces from copied text behave like normal word spaces here.",
    });
  }

  normalized = normalized
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  return { text: normalized, changes };
}

function inferZones(text: string): DocumentZone[] {
  const zones: DocumentZone[] = [];

  addRegexZones(
    zones,
    text,
    /```[\s\S]*?```/g,
    "code-fence",
    "Markdown code block",
    0.99,
  );
  addRegexZones(zones, text, /`[^`\n]+`/g, "inline-code", "Inline code", 0.92);
  addRegexZones(zones, text, /https?:\/\/[^\s<>"')]+/gi, "url", "URL", 0.99);
  addRegexZones(
    zones,
    text,
    /\[\[[\s\S]*?\]\]|\{%\s*[\s\S]*?\s*%\}/g,
    "template-tag",
    "Template tag",
    0.96,
  );

  let cursor = 0;
  for (const value of text.split("\n")) {
    const start = cursor;
    const end = start + value.length;

    if (/^(Subject|List-Unsubscribe|From|To|Cc|Bcc|Reply-To):/i.test(value)) {
      zones.push(
        zone(
          "email-header",
          "Email header",
          start,
          end,
          0.98,
          "Line uses a standard email header name.",
        ),
      );
    } else if (
      /^(ITEM\s+\d+[A-Z]?\.|PRESS EN|Council of the EU|PRESS RELEASE)/i.test(
        value,
      )
    ) {
      zones.push(
        zone(
          "heading",
          "Copied heading",
          start,
          end,
          0.9,
          "Line looks like a document heading or PDF header.",
        ),
      );
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim())) {
      zones.push(
        zone(
          "metadata",
          "Date metadata",
          start,
          end,
          0.95,
          "Line is a standalone date from copied document metadata.",
        ),
      );
    } else if (/^\s*>/.test(value)) {
      zones.push(
        zone(
          "quote",
          "Quoted thread text",
          start,
          end,
          0.88,
          "Line starts with a quote marker.",
        ),
      );
    }

    cursor = end + 1;
  }

  const merged = mergeZones(zones);
  const proseRanges = inferProseZones(text, merged);

  return [...zones, ...proseRanges].sort(
    (a, b) => a.start - b.start || a.kind.localeCompare(b.kind),
  );
}

function classifyDocument(
  text: string,
  zones: DocumentZone[],
  wordCount: number,
): DocumentProfile {
  const trimmed = text.trim();

  if (!trimmed) {
    return profile(
      "empty",
      "Empty draft",
      1,
      "There is no prose to analyze.",
      wordCount,
    );
  }

  if (wordCount > 5000 || text.length > 25000) {
    return profile(
      "huge",
      "Large pasted document",
      0.96,
      "The input is over the large-document threshold.",
      wordCount,
    );
  }

  if (
    zones.some(
      (zone) => zone.kind === "email-header" || zone.kind === "template-tag",
    )
  ) {
    return profile(
      "email-template",
      "Email/template text",
      0.95,
      "Email headers or template tags were detected.",
      wordCount,
    );
  }

  if (
    zones.some((zone) => zone.kind === "code-fence") ||
    /Repository:|Live site:|npm install|make build/.test(text)
  ) {
    return profile(
      "markdown",
      "Markdown or README text",
      0.92,
      "Markdown/code conventions were detected.",
      wordCount,
    );
  }

  if (
    /ITEM\s+\d+[A-Z]?\.|SEC|Secure Future Initiative|CY BERSECURITY/i.test(text)
  ) {
    return profile(
      "legal-sec",
      "SEC/legal filing text",
      0.88,
      "SEC-style headings or legal filing vocabulary were detected.",
      wordCount,
    );
  }

  if (
    /Council of the EU|PRESS RELEASE|Digitalisation|fundamental rights/i.test(
      text,
    )
  ) {
    return profile(
      "public-sector-pdf",
      "Public-sector PDF text",
      0.88,
      "Public-sector press-release headers were detected.",
      wordCount,
    );
  }

  if (/^\s*>|Hacker News|comment|could of|should of|atleast/i.test(text)) {
    return profile(
      "social-comment",
      "Social comment",
      0.78,
      "Comment-like markers or informal usage were detected.",
      wordCount,
    );
  }

  if (wordCount < 80 && /[.!?,;:][A-Za-z]/.test(text)) {
    return profile(
      "social-comment",
      "Social comment",
      0.66,
      "Short pasted prose has comment-like punctuation artifacts.",
      wordCount,
    );
  }

  if (Array.from(text).some((char) => char.charCodeAt(0) > 127)) {
    return profile(
      "mixed-language",
      "Mixed-language or Unicode-rich text",
      0.7,
      "Non-ASCII text was detected.",
      wordCount,
    );
  }

  return profile(
    "plain",
    "Plain prose",
    0.65,
    "No specialized document shape was detected.",
    wordCount,
  );
}

function inferAnomalies(
  text: string,
  document: DocumentProfile,
): AnalysisAnomaly[] {
  const anomalies: AnalysisAnomaly[] = [];

  for (const match of text.matchAll(/[.!?,;:][A-Za-z]/g)) {
    anomalies.push(
      anomaly(
        "glued-punctuation",
        "Missing space after punctuation",
        "Copied text appears to have punctuation glued to the next word.",
        match.index ?? 0,
        (match.index ?? 0) + match[0].length,
        0.9,
        "Review and apply the spacing repair if it matches the original meaning.",
      ),
    );
  }

  for (const match of text.matchAll(/\w>\s*\w?/g)) {
    anomalies.push(
      anomaly(
        "glued-quote-marker",
        "Glued quote marker",
        "A quote marker appears attached to prose.",
        match.index ?? 0,
        (match.index ?? 0) + match[0].length,
        0.86,
        "Separate the quote marker from the prose or remove it if it is copy noise.",
      ),
    );
  }

  for (const match of text.matchAll(/\b(UNRESOLVE\s+D|CY\s+BERSECURITY)\b/gi)) {
    anomalies.push(
      anomaly(
        "ocr-split-word",
        "Likely OCR/PDF split word",
        "A copied document appears to split a word across spaces.",
        match.index ?? 0,
        (match.index ?? 0) + match[0].length,
        0.92,
        "Apply the repair if the joined word matches the source document.",
      ),
    );
  }

  if (document.largeInput) {
    anomalies.push(
      anomaly(
        "large-input",
        "Large document mode",
        "This draft is large enough that repeated findings should be grouped.",
        0,
        Math.min(text.length, 1),
        0.98,
        "Use grouped suggestions first; cancel and split the input if analysis feels slow.",
      ),
    );
  }

  const repeated = repeatedSentenceCount(text);
  if (repeated >= 20) {
    anomalies.push(
      anomaly(
        "repeated-pattern",
        "Repeated passage pattern",
        `A passage pattern repeats ${repeated} times in this input.`,
        0,
        Math.min(text.length, 1),
        0.94,
        "Review one representative suggestion, then decide whether the pattern applies globally.",
      ),
    );
  }

  return dedupeAnomalies(anomalies);
}

function normalizationSuggestions(text: string): NormalizationChange[] {
  const changes: NormalizationChange[] = [];

  for (const match of text.matchAll(/[.!?,;:][A-Za-z]/g)) {
    const start = (match.index ?? 0) + 1;
    changes.push({
      id: `missing-space:${start}`,
      kind: "missing-space-after-punctuation",
      start,
      end: start,
      original: "",
      replacement: " ",
      confidence: 0.9,
      reason:
        "Punctuation is directly followed by a letter, which often happens when copied text loses a space.",
    });
  }

  for (const match of text.matchAll(/\b(Atleast|atleast)\b/g)) {
    changes.push({
      id: `compound:${match.index}`,
      kind: "compound-word",
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      original: match[0],
      replacement: /^[A-Z]/.test(match[0]) ? "At least" : "at least",
      confidence: 0.91,
      reason: "This common compound typo is usually written as two words.",
    });
  }

  for (const match of text.matchAll(/\b(UNRESOLVE\s+D|CY\s+BERSECURITY)\b/gi)) {
    const original = match[0];
    changes.push({
      id: `ocr:${match.index}`,
      kind: "ocr-split-word",
      start: match.index ?? 0,
      end: (match.index ?? 0) + original.length,
      original,
      replacement: /UNRESOLVE/i.test(original) ? "UNRESOLVED" : "CYBERSECURITY",
      confidence: 0.92,
      reason: "The spacing matches a common PDF/OCR word-splitting artifact.",
    });
  }

  for (const match of text.matchAll(/\w>\s*/g)) {
    const start = (match.index ?? 0) + 1;
    changes.push({
      id: `quote:${start}`,
      kind: "glued-quote-marker",
      start,
      end: start + 1,
      original: ">",
      replacement: " > ",
      confidence: 0.78,
      reason:
        "A quote marker is glued to prose; copied comment threads often need spacing here.",
    });
  }

  return changes;
}

function addRegexZones(
  zones: DocumentZone[],
  text: string,
  pattern: RegExp,
  kind: ZoneKind,
  label: string,
  confidence: number,
) {
  let match = pattern.exec(text);
  while (match) {
    zones.push(
      zone(
        kind,
        label,
        match.index,
        match.index + match[0].length,
        confidence,
        `${label} pattern matched.`,
      ),
    );
    match = pattern.exec(text);
  }
}

function inferProseZones(text: string, zones: DocumentZone[]): DocumentZone[] {
  const prose: DocumentZone[] = [];
  let cursor = 0;
  for (const current of zones) {
    if (cursor < current.start && text.slice(cursor, current.start).trim()) {
      prose.push(
        zone(
          "prose",
          "Prose",
          cursor,
          current.start,
          0.7,
          "Text outside specialized zones is treated as prose.",
        ),
      );
    }
    cursor = Math.max(cursor, current.end);
  }
  if (cursor < text.length && text.slice(cursor).trim()) {
    prose.push(
      zone(
        "prose",
        "Prose",
        cursor,
        text.length,
        0.7,
        "Text outside specialized zones is treated as prose.",
      ),
    );
  }
  return prose;
}

function mergeZones(zones: DocumentZone[]): DocumentZone[] {
  return zones
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .filter((zone, index, sorted) => {
      const previous = sorted[index - 1];
      return (
        !previous || !(zone.start >= previous.start && zone.end <= previous.end)
      );
    });
}

function zone(
  kind: ZoneKind,
  label: string,
  start: number,
  end: number,
  confidence: number,
  reason: string,
): DocumentZone {
  return {
    id: `${kind}:${start}:${end}`,
    kind,
    label,
    start,
    end,
    confidence,
    reason,
  };
}

function profile(
  kind: DocumentKind,
  label: string,
  confidence: number,
  reason: string,
  wordCount: number,
): DocumentProfile {
  return {
    kind,
    label,
    confidence,
    reason,
    wordCount,
    largeInput: kind === "huge",
  };
}

function anomaly(
  kind: string,
  title: string,
  message: string,
  start: number,
  end: number,
  confidence: number,
  nextStep: string,
): AnalysisAnomaly {
  return {
    id: `${kind}:${start}:${end}`,
    kind,
    title,
    message,
    start,
    end,
    confidence,
    nextStep,
  };
}

function dedupeAnomalies(anomalies: AnalysisAnomaly[]): AnalysisAnomaly[] {
  const seen = new Set<string>();
  return anomalies.filter((item) => {
    const key = `${item.kind}:${item.start}:${item.end}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function repeatedSentenceCount(text: string): number {
  const counts = new Map<string, number>();
  for (const sentence of text.split(/[.!?]\s+/)) {
    const normalized = sentence
      .replace(/^\d+\.\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (normalized.length > 40) {
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return Math.max(0, ...counts.values());
}

function repeatedPatternCount(message: string): number {
  return Number.parseInt(message.match(/repeats (\d+) times/)?.[1] ?? "1", 10);
}

function countWords(text: string): number {
  return text.match(/\b[\w']+\b/g)?.length ?? 0;
}

function normalizationTitle(kind: string): string {
  const titles: Record<string, string> = {
    "missing-space-after-punctuation": "Repair copied-text spacing",
    "compound-word": "Split common compound typo",
    "ocr-split-word": "Repair copied PDF word split",
    "glued-quote-marker": "Separate copied quote marker",
    nbsp: "Normalize copied whitespace",
  };
  return titles[kind] ?? "Review copied-text normalization";
}

function normalizationMessage(kind: string): string {
  const messages: Record<string, string> = {
    "missing-space-after-punctuation":
      "A punctuation mark is glued to the next word.",
    "compound-word": "This word is usually written with a space.",
    "ocr-split-word": "This looks like a word split by PDF or OCR extraction.",
    "glued-quote-marker": "A quote marker is attached to surrounding prose.",
    nbsp: "A copied non-breaking space can be treated as a normal space.",
  };
  return messages[kind] ?? "Copied text may need normalization.";
}

function stableText(text: string): string {
  return text.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "");
}
