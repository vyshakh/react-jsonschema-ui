import { useMemo } from 'react';
import { useStore } from 'zustand';
import {
  createFormStore,
  type FormStore,
  type FormStoreOptions,
  type FormStoreState,
  resolveItemKeys,
} from '../store/createFormStore';
import { getIn, type JsonPointer } from '../utils/pointer';
import { useFormStore } from './context';

/**
 * Creates a store for the lifetime of the component. A new store (and fresh
 * state) is created only when `schema`, `uiSchema` or `validator` change
 * identity; other options are read once.
 */
export function useCreateFormStore<T = unknown>(options: FormStoreOptions<T>): FormStore<T> {
  const { schema, uiSchema, validator } = options;
  // biome-ignore lint/correctness/useExhaustiveDependencies: other options are intentionally initial-only.
  return useMemo(() => createFormStore(options), [schema, uiSchema, validator]);
}

export function useFormSelector<T, U>(selector: (state: FormStoreState<T>) => U): U {
  return useStore(useFormStore<T>(), selector);
}

export interface FieldBinding<V = unknown> {
  readonly value: V;
  readonly errors: readonly string[] | undefined;
  readonly touched: boolean;
  readonly onChange: (value: V) => void;
  readonly onBlur: () => void;
}

/**
 * Subscribes to exactly one field. Each slice is a separate primitive or
 * identity-stable selection, so a field re-renders only when its own value,
 * errors or touched flag change, never because a sibling did.
 */
export function useField<V = unknown>(pointer: JsonPointer): FieldBinding<V> {
  const store = useFormStore();
  const value = useStore(store, (state) => getIn(state.values, pointer)) as V;
  const errors = useStore(store, (state) => state.errors[pointer]);
  const touched = useStore(store, (state) => state.touched[pointer] === true);
  const handlers = useMemo(
    () => ({
      onChange: (next: V) => store.getState().setValue(pointer, next),
      onBlur: () => store.getState().blur(pointer),
    }),
    [store, pointer],
  );
  return { value, errors, touched, ...handlers };
}

export interface ArrayFieldBinding {
  /** One stable key per item, for React `key` props. */
  readonly keys: readonly string[];
  readonly errors: readonly string[] | undefined;
  readonly append: (item?: unknown) => void;
  readonly remove: (index: number) => void;
  readonly move: (from: number, to: number) => void;
}

/** Subscribes to an array's shape only; item contents are left to child fields. */
export function useArrayField(pointer: JsonPointer): ArrayFieldBinding {
  const store = useFormStore();
  const length = useStore(store, (state) => {
    const value = getIn(state.values, pointer);
    return Array.isArray(value) ? value.length : 0;
  });
  const recorded = useStore(store, (state) => state.itemKeys[pointer]);
  const errors = useStore(store, (state) => state.errors[pointer]);
  const keys = useMemo(() => resolveItemKeys(recorded, length), [recorded, length]);
  const actions = useMemo(
    () => ({
      append: (item?: unknown) => store.getState().arrayAppend(pointer, item),
      remove: (index: number) => store.getState().arrayRemove(pointer, index),
      move: (from: number, to: number) => store.getState().arrayMove(pointer, from, to),
    }),
    [store, pointer],
  );
  return { keys, errors, ...actions };
}
