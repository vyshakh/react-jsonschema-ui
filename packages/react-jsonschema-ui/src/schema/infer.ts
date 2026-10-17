/**
 * Static value inference for `as const` schemas:
 *
 *   const schema = { type: 'object', properties: { age: { type: 'integer' } } } as const;
 *   type Values = InferSchema<typeof schema>; // { age?: number }
 *
 * Covers the Phase 1 keyword set (type, properties, required, items, enum, const).
 * Anything it cannot see through ($ref, allOf, ...) widens to `unknown`.
 */
export type InferSchema<S> = S extends boolean
  ? unknown
  : S extends { readonly const: infer C }
    ? C
    : S extends { readonly enum: readonly (infer E)[] }
      ? E
      : S extends { readonly type: infer T }
        ? T extends readonly (infer U)[]
          ? InferTypeName<U, S>
          : InferTypeName<T, S>
        : unknown;

type InferTypeName<T, S> = T extends 'string'
  ? string
  : T extends 'number' | 'integer'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'null'
        ? null
        : T extends 'array'
          ? InferArray<S>
          : T extends 'object'
            ? InferObject<S>
            : unknown;

type InferArray<S> = S extends { readonly items: infer I }
  ? I extends readonly unknown[]
    ? unknown[]
    : InferSchema<I>[]
  : unknown[];

type RequiredKeys<S> = S extends { readonly required: readonly (infer R)[] } ? R : never;

type InferObject<S> = S extends { readonly properties: infer P }
  ? Simplify<
      { -readonly [K in keyof P & RequiredKeys<S>]: InferSchema<P[K]> } & {
        -readonly [K in Exclude<keyof P, RequiredKeys<S>>]?: InferSchema<P[K]>;
      }
    >
  : Record<string, unknown>;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type DeepPartial<T> = T extends readonly (infer E)[]
  ? DeepPartial<E>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
