import { createStore, type StoreApi } from 'zustand/vanilla';
import { getDefaultValues } from '../parser/defaults';
import { type FieldNode, getNodeAt, parseSchema } from '../parser/parse';
import type { DeepPartial } from '../schema/infer';
import type { JSONSchema } from '../schema/types';
import type { UiSchema } from '../schema/ui';
import { getIn, type JsonPointer, setIn } from '../utils/pointer';
import { createAjvValidator } from '../validation/ajv';
import {
  EMPTY_ERRORS,
  hasErrorsWithin,
  replaceErrorsWithin,
  shareErrors,
  toErrorMap,
} from '../validation/errors';
import type { ErrorMap, SchemaValidator } from '../validation/types';
import { mapKeysWithin, moveIndex, removeIndex, removeKeysWithin } from './remap';

/**
 * - `onChange`: a field validates on every change and on blur.
 * - `onBlur`: a field validates on blur, then on change while it has errors.
 * - `onSubmit`: nothing validates until the first submit.
 */
export type ValidateMode = 'onChange' | 'onBlur' | 'onSubmit';

export interface FormStoreOptions<T> {
  readonly schema: JSONSchema;
  readonly uiSchema?: UiSchema;
  readonly initialValues?: DeepPartial<T>;
  /** Defaults to a shared Ajv validator. */
  readonly validator?: SchemaValidator;
  /** Mode before the first submit. Default `'onBlur'`. */
  readonly validateMode?: ValidateMode;
  /** Mode after the first submit; the whole form re-validates. Default `'onChange'`. */
  readonly reValidateMode?: Exclude<ValidateMode, 'onSubmit'>;
}

export interface FormState<T> {
  readonly schema: JSONSchema;
  readonly root: FieldNode;
  readonly values: T;
  readonly initialValues: T;
  readonly errors: ErrorMap;
  readonly touched: Readonly<Record<string, true>>;
  /**
   * Stable React keys per array pointer, kept in sync by the array actions.
   * Absent until an array is first mutated; read through `resolveItemKeys`.
   */
  readonly itemKeys: Readonly<Record<string, readonly string[]>>;
  readonly submitCount: number;
}

export interface FormActions<T> {
  setValue(pointer: JsonPointer, value: unknown): void;
  blur(pointer: JsonPointer): void;
  /** Validates the whole form and shows every error. Returns validity. */
  validate(): boolean;
  /** Counts a submit attempt, validates everything, and returns the outcome. */
  submit(): { readonly valid: boolean; readonly values: T };
  /** Replaces errors wholesale, e.g. with server-side errors. */
  setErrors(errors: ErrorMap): void;
  reset(values?: DeepPartial<T>): void;
  arrayAppend(pointer: JsonPointer, item?: unknown): void;
  arrayRemove(pointer: JsonPointer, index: number): void;
  arrayMove(pointer: JsonPointer, from: number, to: number): void;
}

export type FormStoreState<T> = FormState<T> & FormActions<T>;
export type FormStore<T = unknown> = StoreApi<FormStoreState<T>>;

let sharedValidator: SchemaValidator | undefined;
const getSharedValidator = (): SchemaValidator => {
  sharedValidator ??= createAjvValidator();
  return sharedValidator;
};

export function createFormStore<T = unknown>(options: FormStoreOptions<T>): FormStore<T> {
  const { schema, validateMode = 'onBlur', reValidateMode = 'onChange' } = options;
  const validator = options.validator ?? getSharedValidator();
  const root = parseSchema(schema, options.uiSchema);
  const initialValues = getDefaultValues(root, options.initialValues) as T;
  let keySeq = 0;

  return createStore<FormStoreState<T>>()((set, get) => {
    const runValidation = (values: T): ErrorMap =>
      toErrorMap(validator.validate(schema, values).errors);

    const validateOn = (pointer: JsonPointer, trigger: 'change' | 'blur'): void => {
      const { submitCount, errors, values } = get();
      const submitted = submitCount > 0;
      const mode: ValidateMode = submitted ? reValidateMode : validateMode;
      const run =
        trigger === 'blur'
          ? mode !== 'onSubmit'
          : mode === 'onChange' || hasErrorsWithin(errors, pointer);
      if (!run) return;
      const next = runValidation(values);
      set({
        errors: submitted ? shareErrors(errors, next) : replaceErrorsWithin(errors, next, pointer),
      });
    };

    const currentKeys = (pointer: JsonPointer, length: number): readonly string[] =>
      resolveItemKeys(get().itemKeys[pointer], length);

    const currentArray = (pointer: JsonPointer): readonly unknown[] => {
      const value = getIn(get().values, pointer);
      return Array.isArray(value) ? value : [];
    };

    /** Applies an index remapping to every pointer-keyed map under `pointer`. */
    const restructure = (
      pointer: JsonPointer,
      nextArray: unknown[],
      nextKeys: readonly string[],
      mapIndex: (index: number) => number | undefined,
    ): void => {
      set((state) => ({
        values: setIn(state.values, pointer, nextArray),
        errors: mapKeysWithin(state.errors, pointer, mapIndex),
        touched: mapKeysWithin(state.touched, pointer, mapIndex),
        itemKeys: { ...mapKeysWithin(state.itemKeys, pointer, mapIndex), [pointer]: nextKeys },
      }));
      validateOn(pointer, 'change');
    };

    return {
      schema,
      root,
      values: initialValues,
      initialValues,
      errors: EMPTY_ERRORS,
      touched: {},
      itemKeys: {},
      submitCount: 0,

      setValue(pointer, value) {
        const state = get();
        const values = setIn(state.values, pointer, value);
        if (values === state.values) return;
        // Replacing a subtree wholesale invalidates item keys recorded under it.
        set({ values, itemKeys: removeKeysWithin(state.itemKeys, pointer) });
        validateOn(pointer, 'change');
      },

      blur(pointer) {
        if (!get().touched[pointer])
          set((state) => ({ touched: { ...state.touched, [pointer]: true } }));
        validateOn(pointer, 'blur');
      },

      validate() {
        const next = runValidation(get().values);
        set((state) => ({ errors: shareErrors(state.errors, next) }));
        return next === EMPTY_ERRORS;
      },

      submit() {
        set((state) => ({ submitCount: state.submitCount + 1 }));
        const valid = get().validate();
        return { valid, values: get().values };
      },

      setErrors(errors) {
        set((state) => ({ errors: shareErrors(state.errors, errors) }));
      },

      reset(values) {
        const next = getDefaultValues(root, values ?? options.initialValues) as T;
        set({
          values: next,
          initialValues: next,
          errors: EMPTY_ERRORS,
          touched: {},
          itemKeys: {},
          submitCount: 0,
        });
      },

      arrayAppend(pointer, item) {
        const array = currentArray(pointer);
        const node = getNodeAt(root, pointer);
        const value =
          item !== undefined || node?.kind !== 'array' ? item : getDefaultValues(node.items);
        const keys = [...currentKeys(pointer, array.length), `k${++keySeq}`];
        restructure(pointer, [...array, value], keys, (i) => i);
      },

      arrayRemove(pointer, index) {
        const array = currentArray(pointer);
        if (index < 0 || index >= array.length) return;
        const keys = currentKeys(pointer, array.length).filter((_, i) => i !== index);
        restructure(
          pointer,
          array.filter((_, i) => i !== index),
          keys,
          (i) => removeIndex(i, index),
        );
      },

      arrayMove(pointer, from, to) {
        const array = currentArray(pointer);
        if (from === to || from < 0 || to < 0 || from >= array.length || to >= array.length) return;
        const nextArray = array.slice();
        nextArray.splice(to, 0, ...nextArray.splice(from, 1));
        const keys = currentKeys(pointer, array.length).slice();
        keys.splice(to, 0, ...keys.splice(from, 1));
        restructure(pointer, nextArray, keys, (i) => moveIndex(i, from, to));
      },
    };
  });
}

/** Recorded item keys (`state.itemKeys[pointer]`), falling back to index-derived keys. */
export function resolveItemKeys(
  recorded: readonly string[] | undefined,
  length: number,
): readonly string[] {
  if (recorded && recorded.length === length) return recorded;
  return Array.from({ length }, (_, i) => `i${i}`);
}
