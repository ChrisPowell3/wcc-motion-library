import {describe, expect, it} from 'vitest';
import {existsSync} from 'node:fs';
import catalog from '../catalog.json';
import * as lib from '../src/index';

type Piece = {id: string; name: string; export: string; summary: string; status: string; settings: Record<string, unknown>; reducedMotion: string; demo: string};
const pieces = catalog.pieces as Piece[];

describe('catalog', () => {
  it('ids are unique kebab-case', () => {
    const ids = pieces.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  for (const p of pieces) {
    it(`${p.id} is exported, tested, demoed and described`, () => {
      expect(typeof (lib as Record<string, unknown>)[p.export]).toBe('function');
      expect(existsSync(`tests/${p.id}.test.tsx`)).toBe(true);
      expect(existsSync(p.demo)).toBe(true);
      expect(p.name && p.summary && p.reducedMotion).toBeTruthy();
      expect(['ready', 'beta']).toContain(p.status);
    });
  }
});

describe('tokens', () => {
  it('springs are sane', () => {
    for (const s of Object.values(lib.springs)) { expect(s.stiffness).toBeGreaterThan(0); expect(s.damping).toBeGreaterThan(0); }
  });
});
