#!/usr/bin/env node
/**
 * Re-records the deterministic performance baseline.
 *
 * Run after a change to the physics, the car data, the parts or the scripted
 * driver that you MEANT to make. Then regenerate the tables in
 * BALANCE_NOTES.md in the same commit -- that file is produced by the same
 * driver and goes stale silently otherwise.
 *
 * A plain node script rather than an inline environment variable in the npm
 * script, because `VAR=1 vitest` is a syntax error in PowerShell.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'npx',
  ['vitest', 'run', 'packages/game-core/src/sim/baseline.test.ts'],
  { stdio: 'inherit', shell: true, env: { ...process.env, UPDATE_BASELINE: '1' } },
);

process.exit(result.status ?? 1);
