import { describe, expect, it } from 'vitest';
import type { JSONSchema } from '../schema/types';
import { getDefaultValues } from './defaults';
import { type FieldNode, getNodeAt, parseSchema } from './parse';

const names = (node: FieldNode) =>
  node.kind === 'object' ? node.properties.map((child) => child.name) : [];

describe('parseSchema', () => {
  const schema: JSONSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', title: 'Full name' },
      email: { type: 'string', format: 'email' },
      age: { type: ['integer', 'null'] },
      agree: { type: 'boolean' },
      color: { enum: ['red', 'green'] },
      size: {
        oneOf: [
          { const: 's', title: 'Small' },
          { const: 'l', title: 'Large' },
        ],
      },
      tags: { type: 'array', items: { type: 'string' } },
    },
  };

  it('maps types to kinds and default widgets', () => {
    const root = parseSchema(schema);
    if (root.kind !== 'object') throw new Error('expected object');
    const byName = Object.fromEntries(root.properties.map((child) => [child.name, child]));
    expect(byName.name).toMatchObject({
      kind: 'string',
      widget: 'text',
      required: true,
      title: 'Full name',
    });
    expect(byName.email).toMatchObject({ widget: 'email', required: false, title: 'email' });
    expect(byName.age).toMatchObject({ kind: 'integer', nullable: true, widget: 'number' });
    expect(byName.agree).toMatchObject({ kind: 'boolean', widget: 'checkbox' });
    expect(byName.color).toMatchObject({ kind: 'string', widget: 'select' });
    expect(byName.size).toMatchObject({
      widget: 'select',
      enumOptions: [
        { value: 's', label: 'Small' },
        { value: 'l', label: 'Large' },
      ],
    });
    expect(byName.tags).toMatchObject({ kind: 'array', items: { kind: 'string' } });
  });

  it('caches by schema and uiSchema identity', () => {
    const ui = {};
    expect(parseSchema(schema, ui)).toBe(parseSchema(schema, ui));
    expect(parseSchema(schema, ui)).not.toBe(parseSchema(schema, {}));
  });

  it('applies uiSchema directives and ordering', () => {
    const root = parseSchema(schema, {
      'ui:order': ['tags', '*', 'name'],
      email: { 'ui:widget': 'textarea', 'ui:placeholder': 'you@example.com' },
      color: { 'ui:enumNames': ['Red', 'Green'] },
    });
    expect(names(root)).toEqual(['tags', 'email', 'age', 'agree', 'color', 'size', 'name']);
    expect(getNodeAt(root, '/email')).toMatchObject({
      widget: 'textarea',
      placeholder: 'you@example.com',
    });
    expect(getNodeAt(root, '/color')).toMatchObject({
      enumOptions: [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
      ],
    });
  });

  it('resolves $ref, allOf and recursive schemas', () => {
    const recursive: JSONSchema = {
      $defs: {
        person: {
          type: 'object',
          properties: { name: { type: 'string' }, friend: { $ref: '#/$defs/person' } },
        },
        named: { properties: { id: { type: 'string' } }, required: ['id'] },
      },
      allOf: [{ $ref: '#/$defs/named' }],
      type: 'object',
      properties: { owner: { $ref: '#/$defs/person', title: 'Owner' } },
    };
    const root = parseSchema(recursive);
    expect(names(root)).toEqual(['owner', 'id']);
    expect(getNodeAt(root, '/id')?.required).toBe(true);
    expect(getNodeAt(root, '/owner')?.title).toBe('Owner');
    expect(getNodeAt(root, '/owner/friend/friend/name')?.kind).toBe('string');
  });
});

describe('getDefaultValues', () => {
  it('fills defaults without overwriting provided values', () => {
    const root = parseSchema({
      type: 'object',
      required: ['address'],
      properties: {
        name: { type: 'string', default: 'Ada' },
        role: { type: 'string', default: 'user' },
        address: { type: 'object', properties: { city: { type: 'string' } } },
        optional: { type: 'object', properties: { x: { type: 'string' } } },
        withDefault: { type: 'object', properties: { x: { type: 'number', default: 1 } } },
        list: { type: 'array', minItems: 2, items: { type: 'string', default: '' } },
      },
    });
    expect(getDefaultValues(root, { role: 'admin' })).toEqual({
      name: 'Ada',
      role: 'admin',
      address: {},
      withDefault: { x: 1 },
      list: ['', ''],
    });
  });

  it('terminates on recursive schemas', () => {
    const root = parseSchema({
      $defs: {
        node: {
          type: 'object',
          required: ['child'],
          properties: { child: { $ref: '#/$defs/node' } },
        },
      },
      $ref: '#/$defs/node',
    });
    expect(getDefaultValues(root)).toEqual({});
  });

  it('preserves identity when nothing changes', () => {
    const root = parseSchema({ type: 'object', properties: { a: { type: 'string' } } });
    const value = { a: 'x' };
    expect(getDefaultValues(root, value)).toBe(value);
  });
});
