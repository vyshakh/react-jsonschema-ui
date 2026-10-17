import { describe, expect, it } from 'vitest';
import { getIn, isWithin, joinPointer, parsePointer, setIn } from './pointer';

describe('pointer', () => {
  it('escapes and parses tokens', () => {
    const pointer = joinPointer('', 'a/b', 'c~d', 0);
    expect(pointer).toBe('/a~1b/c~0d/0');
    expect(parsePointer(pointer)).toEqual(['a/b', 'c~d', '0']);
  });

  it('reads nested values', () => {
    expect(getIn({ a: [{ b: 1 }] }, '/a/0/b')).toBe(1);
    expect(getIn({ a: 1 }, '/a/b')).toBeUndefined();
    expect(getIn(5, '')).toBe(5);
  });

  it('writes with structural sharing', () => {
    const source = { a: { x: 1 }, b: { y: 2 } };
    const next = setIn(source, '/a/x', 3);
    expect(next).toEqual({ a: { x: 3 }, b: { y: 2 } });
    expect(next.b).toBe(source.b);
    expect(setIn(source, '/a/x', 1)).toBe(source);
  });

  it('creates missing containers by token shape', () => {
    expect(setIn({}, '/list/0/name', 'n')).toEqual({ list: [{ name: 'n' }] });
    expect(setIn({ list: [1] }, '/list/-', 2)).toEqual({ list: [1, 2] });
  });

  it('removes object keys when writing undefined', () => {
    expect(setIn({ a: 1, b: 2 }, '/a', undefined)).toEqual({ b: 2 });
  });

  it('checks containment on token boundaries', () => {
    expect(isWithin('/ab', '/a')).toBe(false);
    expect(isWithin('/a/b', '/a')).toBe(true);
    expect(isWithin('/a', '')).toBe(true);
  });
});
