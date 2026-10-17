import Ajv, { type ErrorObject, type Options } from 'ajv';
import addFormats from 'ajv-formats';
import type { JSONSchema } from '../schema/types';
import { type JsonPointer, joinPointer } from '../utils/pointer';
import type { FieldError, SchemaValidator, ValidationResult } from './types';

/** Shape of an Ajv validate function, including standalone (precompiled) ones. */
export interface AjvValidateFunction {
  (data: unknown): boolean | Promise<unknown>;
  errors?: ErrorObject[] | null;
}

export interface AjvValidatorOptions {
  /** Bring your own instance (e.g. `Ajv2020`, custom keywords). */
  readonly ajv?: Ajv;
  /** Options for the default instance; ignored when `ajv` is given. */
  readonly ajvOptions?: Options;
  /** Register `ajv-formats` on the default instance. Default `true`. */
  readonly formats?: boolean;
  readonly transformErrors?: (errors: FieldError[]) => FieldError[];
}

/**
 * Ajv-backed validator. Compiled functions are cached per schema object.
 *
 * Ajv compiles schemas with `new Function`. If your React Native runtime
 * restricts that, precompile with Ajv standalone code generation and wrap the
 * output with `fromAjvValidateFunction` instead.
 */
export function createAjvValidator(options: AjvValidatorOptions = {}): SchemaValidator {
  const ajv = options.ajv ?? createDefaultAjv(options);
  const compiled = new WeakMap<JSONSchema, AjvValidateFunction>();

  return {
    validate(schema, data) {
      let validate = compiled.get(schema);
      if (!validate) {
        validate = ajv.compile(schema as Record<string, unknown>) as AjvValidateFunction;
        compiled.set(schema, validate);
      }
      return runValidate(validate, data, options.transformErrors);
    },
  };
}

/** Adapts a precompiled validate function; the `schema` argument is ignored. */
export function fromAjvValidateFunction(
  validate: AjvValidateFunction,
  transformErrors?: AjvValidatorOptions['transformErrors'],
): SchemaValidator {
  return { validate: (_schema, data) => runValidate(validate, data, transformErrors) };
}

function createDefaultAjv(options: AjvValidatorOptions): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false, ...options.ajvOptions });
  if (options.formats !== false) addFormats(ajv);
  return ajv;
}

function runValidate(
  validate: AjvValidateFunction,
  data: unknown,
  transformErrors: AjvValidatorOptions['transformErrors'],
): ValidationResult {
  const valid = validate(data);
  if (typeof valid !== 'boolean') {
    throw new Error('Async schemas ($async) are not supported by the form validator');
  }
  if (valid) return VALID;
  let errors = (validate.errors ?? []).map(toFieldError);
  if (transformErrors) errors = transformErrors(errors);
  return { valid: errors.length === 0, errors };
}

const VALID: ValidationResult = Object.freeze({ valid: true, errors: Object.freeze([]) });

function toFieldError(error: ErrorObject): FieldError {
  const base = error.instancePath as JsonPointer;
  const missing = (error.params as { missingProperty?: unknown }).missingProperty;
  // `required` / `dependentRequired` are reported on the parent; attach them to the child field.
  if (typeof missing === 'string') {
    return {
      pointer: joinPointer(base, missing),
      message: 'is a required property',
      keyword: error.keyword,
      params: error.params,
    };
  }
  return {
    pointer: base,
    message: error.message ?? 'is invalid',
    keyword: error.keyword,
    params: error.params,
  };
}
