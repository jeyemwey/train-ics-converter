import { describe, it, expect } from 'vitest';
import { decode, encode } from './binary-utils.js';

describe('x == decode(encode(x))', () => {
  it('for strings', () => {
    const x = "test phrase";
    const out = decode(encode(x));

	expect(x).toEqual(out);
  });
});