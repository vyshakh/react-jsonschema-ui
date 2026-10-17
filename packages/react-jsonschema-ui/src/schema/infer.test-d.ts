import { expectTypeOf, test } from 'vitest';
import type { InferSchema } from './infer';
import type { UiSchema } from './ui';

test('InferSchema', () => {
  const schema = {
    type: 'object',
    required: ['name', 'tags'],
    properties: {
      name: { type: 'string' },
      age: { type: ['integer', 'null'] },
      color: { enum: ['red', 'green'] },
      tags: { type: 'array', items: { type: 'string' } },
      address: { type: 'object', properties: { city: { type: 'string' } } },
    },
  } as const;

  expectTypeOf<InferSchema<typeof schema>>().toEqualTypeOf<{
    name: string;
    tags: string[];
    age?: number | null;
    color?: 'red' | 'green';
    address?: { city?: string };
  }>();
});

test('UiSchema follows the value shape', () => {
  type Values = { name: string; tags: string[] };
  expectTypeOf<{
    name: { 'ui:widget': 'textarea' };
    tags: { items: { 'ui:placeholder': 'tag' } };
  }>().toExtend<UiSchema<Values>>();
  // @ts-expect-error unknown key
  const bad: UiSchema<Values> = { nope: {} };
  void bad;
});
