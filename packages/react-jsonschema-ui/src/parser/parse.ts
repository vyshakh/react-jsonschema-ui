import type { JSONSchema, JSONSchemaDefinition, JSONSchemaTypeName } from '../schema/types';
import type { UiDirectives, UiSchema } from '../schema/ui';
import { type JsonPointer, parsePointer } from '../utils/pointer';
import { createResolver, type SchemaResolver } from './resolve';

export type FieldKind =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null'
  | 'unknown';

export interface EnumOption {
  readonly value: unknown;
  readonly label: string;
}

interface BaseFieldNode {
  /** Resolved schema for this field ($ref and allOf already applied). */
  readonly schema: JSONSchema;
  readonly uiSchema: UiSchema;
  /** Property name inside the parent object; undefined for the root and array items. */
  readonly name: string | undefined;
  readonly required: boolean;
  /** `type` included `'null'` alongside another type. */
  readonly nullable: boolean;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly placeholder: string | undefined;
  readonly help: string | undefined;
  readonly hidden: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly autofocus: boolean;
  /** Registry key of the widget/template that renders this node. */
  readonly widget: string;
  /** `ui:field` override: replaces the whole field implementation. */
  readonly field: string | undefined;
  readonly options: Readonly<Record<string, unknown>>;
}

export interface ObjectFieldNode extends BaseFieldNode {
  readonly kind: 'object';
  /** Child fields in display order. Built lazily, so recursive schemas are safe. */
  readonly properties: readonly FieldNode[];
}

export interface ArrayFieldNode extends BaseFieldNode {
  readonly kind: 'array';
  /** Template node shared by every item; built lazily. */
  readonly items: FieldNode;
}

export interface LeafFieldNode extends BaseFieldNode {
  readonly kind: Exclude<FieldKind, 'object' | 'array'>;
  readonly enumOptions: readonly EnumOption[] | undefined;
}

export type FieldNode = ObjectFieldNode | ArrayFieldNode | LeafFieldNode;

const NO_UI: UiSchema = Object.freeze({});
const cache = new WeakMap<JSONSchema, WeakMap<UiSchema, FieldNode>>();

/**
 * Compiles a schema + uiSchema into a value-independent tree of field nodes.
 * The tree holds no pointers, so array items share one template node and the
 * renderer derives pointers while walking. Results are cached by the identity
 * of `schema` and `uiSchema`; keep both referentially stable between renders.
 */
export function parseSchema(schema: JSONSchema, uiSchema?: UiSchema): FieldNode {
  const ui = uiSchema ?? NO_UI;
  let byUi = cache.get(schema);
  if (!byUi) {
    byUi = new WeakMap();
    cache.set(schema, byUi);
  }
  let node = byUi.get(ui);
  if (!node) {
    node = buildNode(createResolver(schema), schema, ui, undefined, true);
    byUi.set(ui, node);
  }
  return node;
}

/** Walks a parsed tree along a pointer. Array indices map to the item template. */
export function getNodeAt(root: FieldNode, pointer: JsonPointer): FieldNode | undefined {
  let node: FieldNode | undefined = root;
  for (const token of parsePointer(pointer)) {
    if (!node) return undefined;
    if (node.kind === 'object') node = node.properties.find((child) => child.name === token);
    else if (node.kind === 'array') node = node.items;
    else return undefined;
  }
  return node;
}

function buildNode(
  resolver: SchemaResolver,
  definition: JSONSchemaDefinition | undefined,
  uiSchema: UiSchema,
  name: string | undefined,
  required: boolean,
): FieldNode {
  const schema = resolver.resolve(definition);
  const ui: UiDirectives = uiSchema;
  const { kind, nullable } = detectKind(schema);

  const base: BaseFieldNode = {
    schema,
    uiSchema,
    name,
    required,
    nullable,
    title: ui['ui:title'] ?? schema.title ?? name,
    description: ui['ui:description'] ?? schema.description,
    placeholder: ui['ui:placeholder'],
    help: ui['ui:help'],
    hidden: ui['ui:hidden'] === true,
    disabled: ui['ui:disabled'] === true,
    readOnly: ui['ui:readonly'] === true || schema.readOnly === true,
    autofocus: ui['ui:autofocus'] === true,
    widget: ui['ui:widget'] ?? kind,
    field: ui['ui:field'],
    options: ui['ui:options'] ?? {},
  };

  if (kind === 'object') {
    const requiredSet = new Set(schema.required);
    const properties = lazy(() => {
      const defs = schema.properties ?? {};
      return orderKeys(Object.keys(defs), ui['ui:order']).map((key) =>
        buildNode(resolver, defs[key], childUi(uiSchema, key), key, requiredSet.has(key)),
      );
    });
    return {
      ...base,
      kind,
      get properties() {
        return properties();
      },
    };
  }

  if (kind === 'array') {
    const items = lazy(() => {
      const def = Array.isArray(schema.items) ? undefined : (schema.items as JSONSchemaDefinition);
      return buildNode(resolver, def, childUi(uiSchema, 'items'), undefined, false);
    });
    return {
      ...base,
      kind,
      // A set of enum values is a multi-select, as in RJSF.
      widget: ui['ui:widget'] ?? (isMultiSelect(schema, resolver) ? 'checkboxes' : kind),
      get items() {
        return items();
      },
    };
  }

  const enumOptions = readEnumOptions(schema, ui, resolver);
  return {
    ...base,
    kind,
    enumOptions,
    widget: ui['ui:widget'] ?? defaultLeafWidget(kind, schema, enumOptions),
  };
}

function isMultiSelect(schema: JSONSchema, resolver: SchemaResolver): boolean {
  if (schema.uniqueItems !== true || schema.items === undefined || Array.isArray(schema.items)) {
    return false;
  }
  const items = resolver.resolve(schema.items as JSONSchemaDefinition);
  return (
    items.enum !== undefined ||
    (items.oneOf?.every((b) => resolver.resolve(b).const !== undefined) ?? false)
  );
}

function detectKind(schema: JSONSchema): { kind: FieldKind; nullable: boolean } {
  const types: readonly JSONSchemaTypeName[] =
    schema.type === undefined ? [] : typeof schema.type === 'string' ? [schema.type] : schema.type;
  const nonNull = types.filter((type) => type !== 'null');
  const nullable = nonNull.length > 0 && nonNull.length < types.length;
  const first = nonNull[0] ?? types[0];
  return { kind: first ?? inferKind(schema), nullable };
}

function inferKind(schema: JSONSchema): FieldKind {
  if (schema.properties || schema.additionalProperties || schema.required) return 'object';
  if (schema.items || schema.prefixItems) return 'array';
  const sample = schema.const !== undefined ? [schema.const] : schema.enum;
  if (sample && sample.length > 0) {
    const kinds = new Set(sample.map(kindOfValue));
    if (kinds.size === 1) return [...kinds][0] ?? 'unknown';
  }
  return 'unknown';
}

function kindOfValue(value: unknown): FieldKind {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return 'unknown';
}

function readEnumOptions(
  schema: JSONSchema,
  ui: UiDirectives,
  resolver: SchemaResolver,
): readonly EnumOption[] | undefined {
  if (schema.enum) {
    const names = ui['ui:enumNames'];
    return schema.enum.map((value, i) => ({ value, label: names?.[i] ?? String(value) }));
  }
  // `oneOf: [{ const, title }]` is the idiomatic labelled enum.
  const branches = schema.oneOf ?? schema.anyOf;
  if (branches && branches.length > 0) {
    const resolved = branches.map((branch) => resolver.resolve(branch));
    if (resolved.every((branch) => branch.const !== undefined)) {
      return resolved.map((branch) => ({
        value: branch.const,
        label: branch.title ?? String(branch.const),
      }));
    }
  }
  return undefined;
}

const FORMAT_WIDGETS: Readonly<Record<string, string>> = {
  email: 'email',
  uri: 'url',
  url: 'url',
  date: 'date',
  'date-time': 'datetime',
  time: 'time',
};

function defaultLeafWidget(
  kind: LeafFieldNode['kind'],
  schema: JSONSchema,
  enumOptions: readonly EnumOption[] | undefined,
): string {
  if (enumOptions) return 'select';
  switch (kind) {
    case 'string':
      return (schema.format && FORMAT_WIDGETS[schema.format]) || 'text';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'checkbox';
    default:
      return kind;
  }
}

/** RJSF `ui:order` semantics; unlisted keys go at `'*'` or, without it, at the end. */
function orderKeys(keys: readonly string[], order: readonly string[] | undefined): string[] {
  if (!order) return [...keys];
  const known = new Set(keys);
  const listed = order.filter((key) => key === '*' || known.has(key));
  const listedSet = new Set(listed);
  const rest = keys.filter((key) => !listedSet.has(key));
  const wildcard = listed.indexOf('*');
  if (wildcard === -1) return [...listed, ...rest];
  return [...listed.slice(0, wildcard), ...rest, ...listed.slice(wildcard + 1)];
}

function childUi(uiSchema: UiSchema, key: string): UiSchema {
  const child = (uiSchema as Readonly<Record<string, unknown>>)[key];
  return child !== null && typeof child === 'object' ? (child as UiSchema) : NO_UI;
}

function lazy<T>(factory: () => T): () => T {
  let done = false;
  let value: T;
  return () => {
    if (!done) {
      value = factory();
      done = true;
    }
    return value;
  };
}
