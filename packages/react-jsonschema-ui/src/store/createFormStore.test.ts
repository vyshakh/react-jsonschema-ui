import { describe, expect, it } from 'vitest';
import type { InferSchema } from '../schema/infer';
import { createFormStore, resolveItemKeys } from './createFormStore';

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    nickname: { type: 'string', default: 'anon' },
    tags: { type: 'array', items: { type: 'string', minLength: 1, default: '' } },
  },
} as const;

type Values = InferSchema<typeof schema>;

const make = (options: Partial<Parameters<typeof createFormStore<Values>>[0]> = {}) =>
  createFormStore<Values>({ schema, ...options });

describe('createFormStore', () => {
  it('starts from defaults merged with initial values', () => {
    const store = make({ initialValues: { name: 'Ada' } });
    expect(store.getState().values).toEqual({ name: 'Ada', nickname: 'anon' });
    expect(store.getState().errors).toEqual({});
  });

  it('onBlur mode: validates a field on blur, then live while it has errors', () => {
    const store = make();
    const { setValue, blur } = store.getState();
    setValue('/name', 'A');
    expect(store.getState().errors).toEqual({});
    blur('/name');
    expect(store.getState().errors).toEqual({ '/name': ['must NOT have fewer than 2 characters'] });
    expect(store.getState().touched).toEqual({ '/name': true });
    // Errors for fields the user has not visited stay hidden.
    expect(store.getState().errors['/email']).toBeUndefined();
    setValue('/name', 'Ada');
    expect(store.getState().errors).toEqual({});
  });

  it('onChange mode validates on every change', () => {
    const store = make({ validateMode: 'onChange' });
    store.getState().setValue('/email', 'x');
    expect(store.getState().errors['/email']).toEqual(['must match format "email"']);
  });

  it('submit validates everything and switches to full re-validation', () => {
    const store = make({ validateMode: 'onSubmit' });
    store.getState().blur('/name');
    expect(store.getState().errors).toEqual({});
    const result = store.getState().submit();
    expect(result.valid).toBe(false);
    expect(Object.keys(store.getState().errors).sort()).toEqual(['/email', '/name']);
    store.getState().setValue('/name', 'Ada');
    expect(Object.keys(store.getState().errors)).toEqual(['/email']);
    store.getState().setValue('/email', 'ada@example.com');
    expect(store.getState().submit()).toMatchObject({ valid: true });
  });

  it('keeps sibling values and unchanged error arrays referentially stable', () => {
    const store = make({ initialValues: { tags: ['a'] } });
    store.getState().submit();
    const before = store.getState();
    store.getState().setValue('/nickname', 'x');
    const after = store.getState();
    expect(after.values.tags).toBe(before.values.tags);
    expect(after.errors['/name']).toBe(before.errors['/name']);
  });

  it('array operations keep item keys, errors and touched in sync', () => {
    const store = make({ initialValues: { tags: ['a', '', 'c'] } });
    const s = () => store.getState();
    s().blur('/tags/1');
    expect(s().errors['/tags/1']).toBeDefined();
    const keys = resolveItemKeys(s().itemKeys['/tags'], 3);

    s().arrayRemove('/tags', 0);
    expect(s().values.tags).toEqual(['', 'c']);
    expect(s().itemKeys['/tags']).toEqual([keys[1], keys[2]]);
    expect(s().errors['/tags/0']).toBeDefined();
    expect(s().errors['/tags/1']).toBeUndefined();
    expect(s().touched).toEqual({ '/tags/0': true });

    s().arrayMove('/tags', 0, 1);
    expect(s().values.tags).toEqual(['c', '']);
    expect(s().itemKeys['/tags']).toEqual([keys[2], keys[1]]);
    expect(s().touched).toEqual({ '/tags/1': true });

    s().arrayAppend('/tags');
    expect(s().values.tags).toEqual(['c', '', '']);
    expect(s().itemKeys['/tags']).toHaveLength(3);
    expect(new Set(s().itemKeys['/tags']).size).toBe(3);
  });

  it('reset restores defaults and clears interaction state', () => {
    const store = make();
    store.getState().setValue('/name', 'x');
    store.getState().submit();
    store.getState().reset({ name: 'Bob' });
    expect(store.getState()).toMatchObject({
      values: { name: 'Bob', nickname: 'anon' },
      errors: {},
      touched: {},
      submitCount: 0,
    });
  });
});
