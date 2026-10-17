import { describe, expect, it } from 'vitest';
import { createAjvValidator } from './ajv';
import { replaceErrorsWithin, shareErrors, toErrorMap } from './errors';

describe('createAjvValidator', () => {
  const validator = createAjvValidator();
  const schema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      items: { type: 'array', items: { type: 'object', required: ['id'] } },
    },
  } as const;

  it('reports field-level pointers, attaching required errors to the child', () => {
    const result = validator.validate(schema, { email: 'nope', items: [{}] });
    expect(result.valid).toBe(false);
    expect(toErrorMap(result.errors)).toEqual({
      '/name': ['is a required property'],
      '/email': ['must match format "email"'],
      '/items/0/id': ['is a required property'],
    });
  });

  it('passes valid data', () => {
    expect(validator.validate(schema, { name: 'Ada', email: 'a@b.co' })).toEqual({
      valid: true,
      errors: [],
    });
  });
});

describe('error maps', () => {
  it('shares unchanged arrays and maps', () => {
    const prev = { '/a': ['x'], '/b': ['y'] };
    expect(shareErrors(prev, { '/a': ['x'], '/b': ['y'] })).toBe(prev);
    const next = shareErrors(prev, { '/a': ['x'], '/b': ['z'] });
    expect(next['/a']).toBe(prev['/a']);
    expect(next['/b']).toEqual(['z']);
  });

  it('replaces only errors within a pointer', () => {
    const prev = { '/a': ['old'], '/b': ['keep'] };
    expect(
      replaceErrorsWithin(prev, { '/a/0': ['new'], '/b': ['ignored'], '/c': ['ignored'] }, '/a'),
    ).toEqual({
      '/b': ['keep'],
      '/a/0': ['new'],
    });
  });
});
