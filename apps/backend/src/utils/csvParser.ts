import { parse } from "csv-parse/sync";
import type { ParseResult } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailsFromBuffer(buffer: Buffer, mimeType: string): ParseResult {
  const content = buffer.toString("utf-8");
  const emails: Array<{ email: string; name: string }> = [];
  let total = 0;
  let invalid = 0;

  if (
    mimeType === "text/csv" ||
    mimeType === "text/plain" ||
    mimeType === "application/octet-stream"
  ) {
    try {
      const records = parse(content, {
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      }) as string[][];

      for (const row of records) {
        // Try to extract name + email from row
        if (row.length >= 2) {
          const possibleEmail = row[row.length - 1].trim();
          const possibleName = row.slice(0, -1).join(" ").trim();
          total++;
          if (EMAIL_RE.test(possibleEmail)) {
            emails.push({ email: possibleEmail.toLowerCase(), name: possibleName });
            continue;
          }
        }
        // Single column or fallback
        for (const cell of row) {
          const trimmed = cell.trim();
          total++;
          if (EMAIL_RE.test(trimmed)) {
            emails.push({ email: trimmed.toLowerCase(), name: "" });
          } else {
            invalid++;
          }
        }
      }
    } catch {
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        total++;
        if (EMAIL_RE.test(trimmed)) {
          emails.push({ email: trimmed.toLowerCase(), name: "" });
        } else {
          invalid++;
        }
      }
    }
  }

  // Deduplicate by email
  const seen = new Set<string>();
  const unique = emails.filter((e) => {
    if (seen.has(e.email)) return false;
    seen.add(e.email);
    return true;
  });

  return { emails: unique, total, valid: unique.length, invalid };
}
