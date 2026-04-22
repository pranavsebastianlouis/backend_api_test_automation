import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function extractCsvTestCaseIds(csv: string): string[] {
  // CSV is quoted and contains embedded newlines; the one stable field we rely on is the ID format.
  const ids = new Set<string>();
  const re = /\bTC-(AUTH|AIR|CRU)-\d{3}\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(csv))) ids.add(m[0]);
  return [...ids].sort();
}

test.describe('CSV ↔ API test coverage', () => {
  test('every Test Case ID in CSV exists in api-tests specs', async () => {
    // Playwright runs with cwd = api-tests; keep this robust for local + CI.
    const csvPath = path.resolve(process.cwd(), '..', 'LUXE_API_TestCases.csv');
    const csv = readText(csvPath);
    const ids = extractCsvTestCaseIds(csv);
    expect(ids.length).toBeGreaterThan(0);

    const specsRoot = path.resolve(process.cwd(), 'tests', 'api');
    const specFiles = listFilesRecursive(specsRoot).filter((p) => p.endsWith('.spec.ts'));
    const specText = specFiles.map(readText).join('\n');

    const missing = ids.filter((id) => !specText.includes(id));
    expect(missing, `Missing Test Case IDs in api-tests specs: ${missing.join(', ')}`).toEqual([]);
  });
});

