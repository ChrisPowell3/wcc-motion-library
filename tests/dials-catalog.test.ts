import {describe, expect, it} from 'vitest';
import catalog from '../catalog.json';
import {SHARED_DIALS, PIECE_DIALS, cleanDials} from '../src';

type CatalogDials = {id: string; dials: string[]; dialDefaults: Record<string, string>; unsupportedDials: string[]};
describe('command center dial catalog', () => {
  it('accounts for every dial, validates defaults, and agrees with each piece allowlist', () => {
    const vocabulary = {...SHARED_DIALS, ...PIECE_DIALS};
    for (const raw of catalog.pieces) {
      const piece = raw as unknown as CatalogDials;
      expect(Array.isArray(piece.dials)).toBe(true);
      expect(Object.keys(piece.dialDefaults).sort()).toEqual([...piece.dials].sort());
      expect([...piece.dials, ...piece.unsupportedDials].sort()).toEqual(Object.keys(vocabulary).sort());
      expect(cleanDials(piece.id, piece.dialDefaults)).toEqual(piece.dialDefaults);
      for (const id of piece.unsupportedDials) {
        expect(cleanDials(piece.id, {[id]: vocabulary[id as keyof typeof vocabulary][0]})).toEqual({});
      }
    }
  });
});
