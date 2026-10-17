export type JSONSchemaTypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * JSON Schema (draft-07 / 2019-09 / 2020-12 keyword superset). Every field is
 * readonly so that `as const` schemas are assignable and remain inferable.
 */
export interface JSONSchema {
  readonly $id?: string;
  readonly $schema?: string;
  readonly $ref?: string;
  readonly $comment?: string;
  readonly $defs?: Readonly<Record<string, JSONSchemaDefinition>>;
  readonly definitions?: Readonly<Record<string, JSONSchemaDefinition>>;

  readonly type?: JSONSchemaTypeName | readonly JSONSchemaTypeName[];
  readonly title?: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly examples?: readonly unknown[];
  readonly const?: unknown;
  readonly enum?: readonly unknown[];
  readonly readOnly?: boolean;
  readonly writeOnly?: boolean;

  // string
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;

  // number / integer
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly multipleOf?: number;

  // object
  readonly properties?: Readonly<Record<string, JSONSchemaDefinition>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: JSONSchemaDefinition;
  readonly patternProperties?: Readonly<Record<string, JSONSchemaDefinition>>;
  readonly propertyNames?: JSONSchemaDefinition;
  readonly minProperties?: number;
  readonly maxProperties?: number;
  readonly dependentRequired?: Readonly<Record<string, readonly string[]>>;
  readonly dependentSchemas?: Readonly<Record<string, JSONSchemaDefinition>>;
  readonly dependencies?: Readonly<Record<string, JSONSchemaDefinition | readonly string[]>>;

  // array
  readonly items?: JSONSchemaDefinition | readonly JSONSchemaDefinition[];
  readonly prefixItems?: readonly JSONSchemaDefinition[];
  readonly additionalItems?: JSONSchemaDefinition;
  readonly contains?: JSONSchemaDefinition;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;

  // composition / conditionals
  readonly allOf?: readonly JSONSchemaDefinition[];
  readonly anyOf?: readonly JSONSchemaDefinition[];
  readonly oneOf?: readonly JSONSchemaDefinition[];
  readonly not?: JSONSchemaDefinition;
  readonly if?: JSONSchemaDefinition;
  readonly then?: JSONSchemaDefinition;
  readonly else?: JSONSchemaDefinition;
}

export type JSONSchemaDefinition = JSONSchema | boolean;
