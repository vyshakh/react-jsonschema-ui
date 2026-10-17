import type { JSONSchema } from '../schema/types';
import type { JsonPointer } from '../utils/pointer';

export interface FieldError {
  /** Pointer of the field the error belongs to (`required` errors point at the missing child). */
  readonly pointer: JsonPointer;
  readonly message: string;
  readonly keyword: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly FieldError[];
}

/**
 * Validation engine contract. The store only talks to this interface, so Ajv
 * can be swapped for a precompiled (standalone) validator on Hermes, or for a
 * different library entirely.
 */
export interface SchemaValidator {
  validate(schema: JSONSchema, data: unknown): ValidationResult;
}

/** Messages per field pointer. */
export type ErrorMap = Readonly<Record<string, readonly string[]>>;
