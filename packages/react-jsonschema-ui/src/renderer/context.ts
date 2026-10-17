import { createContext, useContext } from 'react';
import type { JsonPointer } from '../utils/pointer';

export interface FormConfig {
  /** Prefix for generated element ids. Default `'root'`. */
  readonly idPrefix: string;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  /** Runs validation and the submit callbacks; what the submit button calls. */
  readonly submit: () => void;
}

const FormConfigContext = createContext<FormConfig>({
  idPrefix: 'root',
  disabled: false,
  readOnly: false,
  submit: () => {},
});

export const FormConfigProvider = FormConfigContext.Provider;

export function useFormConfig(): FormConfig {
  return useContext(FormConfigContext);
}

/** Submits the enclosing `<SchemaForm>`, for custom submit buttons. */
export function useFormSubmit(): () => void {
  return useContext(FormConfigContext).submit;
}

export function toFieldId(prefix: string, pointer: JsonPointer): string {
  return prefix + pointer.replace(/\//g, '_');
}
