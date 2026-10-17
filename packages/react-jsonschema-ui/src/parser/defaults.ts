import type { JSONSchema } from '../schema/types';
import type { FieldNode } from './parse';

/**
 * Fills schema `default`s into `value` without overwriting anything present.
 * Required (and root) objects are always materialised; optional objects only
 * when they end up containing something. Arrays with `minItems` are padded
 * with default items. Unchanged branches keep their identity.
 */
export function getDefaultValues(node: FieldNode, value?: unknown): unknown {
  return fill(node, value, true, new Set());
}

function fill(node: FieldNode, value: unknown, include: boolean, stack: Set<JSONSchema>): unknown {
  let current = value;
  if (current === undefined && node.schema.default !== undefined) {
    current = cloneJson(node.schema.default);
  }

  if (node.kind === 'object') {
    if (current !== undefined && !isPlainObject(current)) return current;
    // Recursive schema with nothing to descend into: stop here.
    if (current === undefined && stack.has(node.schema)) return undefined;
    stack.add(node.schema);
    let result = (current ?? {}) as Record<string, unknown>;
    let copied = current === undefined;
    for (const child of node.properties) {
      const key = child.name as string;
      const prev = result[key];
      const next = fill(child, prev, child.required, stack);
      if (next !== prev && next !== undefined) {
        if (!copied) {
          result = { ...result };
          copied = true;
        }
        result[key] = next;
      }
    }
    stack.delete(node.schema);
    if (current === undefined && !include && Object.keys(result).length === 0) return undefined;
    return result;
  }

  if (node.kind === 'array') {
    if (Array.isArray(current)) {
      let result: unknown[] = current;
      current.forEach((item, i) => {
        const next = fill(node.items, item, true, stack);
        if (next !== item) {
          if (result === current) result = current.slice();
          result[i] = next;
        }
      });
      return result;
    }
    const minItems = node.schema.minItems ?? 0;
    if (current === undefined && minItems > 0 && !stack.has(node.schema)) {
      stack.add(node.schema);
      const items = Array.from({ length: minItems }, () =>
        fill(node.items, undefined, true, stack),
      );
      stack.delete(node.schema);
      return items;
    }
    return current;
  }

  return current;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return value !== null && typeof value === 'object'
    ? (JSON.parse(JSON.stringify(value)) as T)
    : value;
}
