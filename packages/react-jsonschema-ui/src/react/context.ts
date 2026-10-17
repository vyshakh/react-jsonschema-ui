import { createContext, useContext } from 'react';
import type { FormStore } from '../store/createFormStore';

// biome-ignore lint/suspicious/noExplicitAny: the context is shared by forms of every value type.
const FormStoreContext = createContext<FormStore<any> | null>(null);

export const FormStoreProvider = FormStoreContext.Provider;

export function useFormStore<T = unknown>(): FormStore<T> {
  const store = useContext(FormStoreContext);
  if (!store) throw new Error('useFormStore must be used inside a <FormStoreProvider>');
  return store as FormStore<T>;
}
