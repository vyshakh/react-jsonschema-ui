import type { JSONSchema, JSONSchemaDefinition } from '../schema/types';
import { getIn, type JsonPointer } from '../utils/pointer';

const EMPTY_SCHEMA: JSONSchema = Object.freeze({});
const FALSE_SCHEMA: JSONSchema = Object.freeze({ not: {} });

export interface SchemaResolver {
  readonly root: JSONSchema;
  /**
   * Returns a render-ready schema: `$ref` replaced by its target (sibling
   * keywords win) and `allOf` folded in. Results are memoized per input
   * object, so a recursive schema resolves to the same identity each time,
   * which `getDefaultValues` relies on to detect cycles.
   */
  resolve(definition: JSONSchemaDefinition | undefined): JSONSchema;
}

export function createResolver(root: JSONSchema): SchemaResolver {
  const byRef = new Map<string, JSONSchema>();
  const byObject = new WeakMap<object, JSONSchema>();

  const resolveRef = (ref: string, chain: ReadonlySet<string>): JSONSchema => {
    const cached = byRef.get(ref);
    if (cached) return cached;
    if (!ref.startsWith('#')) {
      throw new Error(`Unsupported $ref "${ref}": only local references ("#/...") are supported`);
    }
    if (chain.has(ref)) throw new Error(`Circular $ref chain at "${ref}"`);
    const target = getIn(root, decodeURIComponent(ref.slice(1)) as JsonPointer);
    if (target === undefined) throw new Error(`Unresolvable $ref "${ref}"`);
    const resolved = resolveWith(target as JSONSchemaDefinition, new Set(chain).add(ref));
    byRef.set(ref, resolved);
    return resolved;
  };

  const resolveWith = (
    definition: JSONSchemaDefinition | undefined,
    chain: ReadonlySet<string>,
  ): JSONSchema => {
    if (definition === undefined || definition === true) return EMPTY_SCHEMA;
    if (definition === false) return FALSE_SCHEMA;
    const cached = byObject.get(definition);
    if (cached) return cached;

    let schema = definition;
    if (schema.$ref !== undefined) {
      const { $ref, $defs, definitions, $id, $schema, $comment, ...siblings } = schema;
      const target = resolveRef($ref, chain);
      // Reuse the target's identity unless sibling keywords actually change it.
      schema = Object.keys(siblings).length > 0 ? { ...target, ...siblings } : target;
    }
    if (schema.allOf) {
      const { allOf, ...base } = schema;
      schema = allOf.reduce<JSONSchema>(
        (merged, part) => mergeSchemas(merged, resolveWith(part, chain)),
        base,
      );
    }
    byObject.set(definition, schema);
    return schema;
  };

  return { root, resolve: (definition) => resolveWith(definition, new Set()) };
}

/**
 * Shallow merge used for rendering only (validation always runs against the
 * original schema). `base` wins on scalar conflicts; properties defined on both
 * sides are combined with `allOf` and resolved lazily when that child renders.
 */
function mergeSchemas(base: JSONSchema, extra: JSONSchema): JSONSchema {
  const merged: { -readonly [K in keyof JSONSchema]: JSONSchema[K] } = { ...extra, ...base };
  if (base.properties || extra.properties) {
    const properties: Record<string, JSONSchemaDefinition> = { ...base.properties };
    for (const [key, value] of Object.entries(extra.properties ?? {})) {
      const own = properties[key];
      properties[key] = own === undefined ? value : { allOf: [own, value] };
    }
    merged.properties = properties;
  }
  if (base.required || extra.required) {
    merged.required = [...new Set([...(base.required ?? []), ...(extra.required ?? [])])];
  }
  return merged;
}
