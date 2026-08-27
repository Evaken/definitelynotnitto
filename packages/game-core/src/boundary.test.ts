import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Architectural guards.
 *
 * PROJECT_SPEC 6.1 says gameplay logic must never live inside UI code, and 6.3
 * says the simulation must be deterministic.  Both are easy to break by
 * accident and impossible to spot in review once the codebase grows, so they
 * are asserted here rather than left as good intentions.
 */

const SRC = fileURLToPath(new URL('.', import.meta.url));

/** This file names the forbidden things in order to look for them. */
const SELF = 'boundary.test.ts';

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path));
    } else if (entry.endsWith('.ts') && entry !== SELF) {
      found.push(path);
    }
  }
  return found;
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    specifiers.push(match[1]!);
  }
  return specifiers;
}

/** Strips comments so prose about `window` is not mistaken for using it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const FORBIDDEN_PACKAGES = ['react', 'react-dom', 'react/jsx-runtime'];

describe('game-core stays free of the UI', () => {
  const files = sourceFiles(SRC);

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('imports no UI framework', () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const specifier of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (FORBIDDEN_PACKAGES.includes(specifier)) {
          offenders.push(`${file} imports ${specifier}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('touches no browser globals', () => {
    // Listed as separate patterns rather than one alternation so a failure
    // message says which global was found.
    const globals = ['document', 'window', 'navigator', 'localStorage', 'HTMLElement'];
    const offenders: string[] = [];

    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const name of globals) {
        if (new RegExp(`(^|[^\\w.'"\`])${name}\\s*[.[]`).test(code)) {
          offenders.push(`${file} uses ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('the simulation stays deterministic', () => {
  it('never reaches for Math.random', () => {
    // Randomness has to come from the seeded generator in sim/rng.ts, or a pass
    // cannot be reproduced -- which breaks regression testing now and race
    // verification once Stage 10 arrives.
    const offenders = sourceFiles(join(SRC, 'sim'))
      .filter((file) => /Math\s*\.\s*random/.test(stripComments(readFileSync(file, 'utf8'))))
      .map((file) => `${file} calls Math.random`);

    expect(offenders).toEqual([]);
  });

  it('never reaches for the wall clock', () => {
    const offenders = sourceFiles(join(SRC, 'sim'))
      .filter((file) =>
        /Date\s*\.\s*now|new\s+Date\s*\(|performance\s*\.\s*now/.test(
          stripComments(readFileSync(file, 'utf8')),
        ),
      )
      .map((file) => `${file} reads the clock`);

    expect(offenders).toEqual([]);
  });
});
