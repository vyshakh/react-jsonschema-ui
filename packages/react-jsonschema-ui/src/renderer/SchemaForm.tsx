import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { FormStoreProvider } from '../react/context';
import { headlessRegistry, mergeRegistry, RegistryProvider } from '../registry/registry';
import type { Registry, RegistryOverrides } from '../registry/types';
import type { InferSchema } from '../schema/infer';
import type { JSONSchema } from '../schema/types';
import { createFormStore, type FormStore, type FormStoreOptions } from '../store/createFormStore';
import { ROOT_POINTER } from '../utils/pointer';
import type { ErrorMap } from '../validation/types';
import { type FormConfig, FormConfigProvider } from './context';
import { SchemaField } from './SchemaField';

export interface SchemaFormProps<S extends JSONSchema, T = InferSchema<S>>
  extends Omit<FormStoreOptions<T>, 'schema'> {
  readonly schema: S;
  /** Widgets, fields and templates layered over the form's base registry. */
  readonly registry?: RegistryOverrides;
  /**
   * Externally owned store, for reading or driving the form from outside.
   * It must have been created for the same schema; store options passed to
   * the form are then ignored.
   */
  readonly store?: FormStore<T>;
  readonly onSubmit?: (values: T) => void;
  readonly onError?: (errors: ErrorMap) => void;
  readonly onChange?: (values: T) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  /** Element id prefix. Default `'root'`. */
  readonly idPrefix?: string;
  readonly submitLabel?: string;
  /**
   * Replaces the default submit button; use `useFormSubmit()` inside. Pass
   * `null` for a form without one.
   */
  readonly children?: ReactNode;
}

/**
 * Builds a `<SchemaForm>` bound to a base registry. The headless core exports
 * one over fragment-only templates; UI kits export their own.
 *
 * The form is uncontrolled: `initialValues` are read when the store is
 * created, which happens again only if `schema`, `uiSchema` or `validator`
 * change identity.
 */
export function createSchemaForm(base: Registry) {
  return function SchemaForm<S extends JSONSchema, T = InferSchema<S>>(
    props: SchemaFormProps<S, T>,
  ) {
    const {
      schema,
      uiSchema,
      validator,
      registry: overrides,
      store: externalStore,
      onSubmit,
      onError,
      onChange,
      disabled = false,
      readOnly = false,
      idPrefix = 'root',
      submitLabel = 'Submit',
      children,
    } = props;

    // biome-ignore lint/correctness/useExhaustiveDependencies: the remaining store options are initial-only.
    const store = useMemo(
      () => externalStore ?? createFormStore<T>(props),
      [externalStore, schema, uiSchema, validator],
    );
    // Keyed on the inner maps so an inline `registry={{ widgets }}` with stable maps stays stable.
    const { widgets, fields, templates } = overrides ?? {};
    const registry = useMemo(
      () =>
        mergeRegistry(base, {
          ...(widgets && { widgets }),
          ...(fields && { fields }),
          ...(templates && { templates }),
        }),
      [widgets, fields, templates],
    );

    const callbacks = useRef({ onSubmit, onError, onChange });
    useEffect(() => {
      callbacks.current = { onSubmit, onError, onChange };
    });

    useEffect(
      () =>
        store.subscribe((state, prev) => {
          if (state.values !== prev.values) callbacks.current.onChange?.(state.values);
        }),
      [store],
    );

    const submit = useCallback(() => {
      const { valid, values } = store.getState().submit();
      if (valid) callbacks.current.onSubmit?.(values);
      else callbacks.current.onError?.(store.getState().errors);
    }, [store]);

    const config = useMemo<FormConfig>(
      () => ({ idPrefix, disabled, readOnly, submit }),
      [idPrefix, disabled, readOnly, submit],
    );

    const { FormTemplate, SubmitButton } = registry.templates;
    const root = store.getState().root;

    return (
      <FormStoreProvider value={store}>
        <RegistryProvider value={registry}>
          <FormConfigProvider value={config}>
            <FormTemplate onSubmit={submit} disabled={disabled}>
              <SchemaField node={root} pointer={ROOT_POINTER} />
              {children === undefined ? (
                <SubmitButton
                  label={submitLabel}
                  disabled={disabled || readOnly}
                  onSubmit={submit}
                />
              ) : (
                children
              )}
            </FormTemplate>
          </FormConfigProvider>
        </RegistryProvider>
      </FormStoreProvider>
    );
  };
}

/** Headless form: supply widgets and templates through `registry`. */
export const SchemaForm = createSchemaForm(headlessRegistry);
