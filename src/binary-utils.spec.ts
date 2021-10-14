import 'mocha';
import { strict as assert } from 'assert';
import { decode, encode } from './binary-utils';

describe('x == decode(encode(x))', () => {
  it('for strings', () => {
    const x = "test phrase";
    const out = decode(encode(x));
    
    assert.equal(x, out);
  });
});