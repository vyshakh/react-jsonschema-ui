import { createContext, Fragment, useContext } from 'react';
import type { Registry, RegistryOverrides, Templates } from './types';

/**
 * Templates that render only their children through fragments. They touch no
 * DOM or native primitives, so the headless engine runs on any renderer;
 * a UI kit (e.g. the Tamagui set) replaces them with real layout.
 */
const headlessTemplates: Templates = {
  FormTemplate: ({ children }) => <>{children}</>,
  FieldTemplate: ({ children }) => <>{children}</>,
  ObjectTemplate: ({ properties }) => (
    <>
      {properties.map((property) => (
        <Fragment key={property.name}>{property.content}</Fragment>
      ))}
    </>
  ),
  ArrayTemplate: ({ items }) => <>{items}</>,
  ArrayItemTemplate: ({ children }) => <>{children}</>,
  SubmitButton: () => null,
  UnsupportedField: () => null,
};

export const headlessRegistry: Registry = { widgets: {}, fields: {}, templates: headlessTemplates };

/** Layers overrides onto a base registry; later arguments win per key. */
export function mergeRegistry(
  base: Registry,
  ...overrides: readonly (RegistryOverrides | undefined)[]
): Registry {
  let result = base;
  for (const override of overrides) {
    if (!override) continue;
    result = {
      widgets: override.widgets ? { ...result.widgets, ...override.widgets } : result.widgets,
      fields: override.fields ? { ...result.fields, ...override.fields } : result.fields,
      templates: override.templates
        ? { ...result.templates, ...override.templates }
        : result.templates,
    };
  }
  return result;
}

const RegistryContext = createContext<Registry>(headlessRegistry);

export const RegistryProvider = RegistryContext.Provider;

export function useRegistry(): Registry {
  return useContext(RegistryContext);
}
