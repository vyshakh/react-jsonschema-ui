import { createElement } from 'react';
import { TamaguiProvider, useThemeName } from 'tamagui';
import { headlessRegistry, mergeRegistry } from '../registry/registry';
import type { Registry } from '../registry/types';
import { createSchemaForm, type SchemaFormProps } from '../renderer/SchemaForm';
import type { InferSchema } from '../schema/infer';
import type { JSONSchema } from '../schema/types';
import { getProviderConfig } from './fallbackConfig';
import { tamaguiTemplates } from './templates';
import { CheckboxWidget, SwitchWidget } from './widgets/boolean';
import { CheckboxesWidget, RadioWidget, SelectWidget } from './widgets/choice';
import { NumberWidget, RangeWidget } from './widgets/number';
import {
  DateTimeWidget,
  DateWidget,
  EmailWidget,
  PasswordWidget,
  TextareaWidget,
  TextWidget,
  TimeWidget,
  UrlWidget,
} from './widgets/text';

export const tamaguiWidgets = {
  text: TextWidget,
  textarea: TextareaWidget,
  password: PasswordWidget,
  email: EmailWidget,
  url: UrlWidget,
  date: DateWidget,
  datetime: DateTimeWidget,
  time: TimeWidget,
  number: NumberWidget,
  range: RangeWidget,
  checkbox: CheckboxWidget,
  switch: SwitchWidget,
  select: SelectWidget,
  radio: RadioWidget,
  checkboxes: CheckboxesWidget,
} satisfies Registry['widgets'];

export const tamaguiRegistry: Registry = mergeRegistry(headlessRegistry, {
  widgets: tamaguiWidgets,
  templates: tamaguiTemplates,
});

const TamaguiSchemaForm = createSchemaForm(tamaguiRegistry);

/**
 * `<SchemaForm>` rendered with Tamagui. Inside your app's `<TamaguiProvider>`
 * the widgets use its tokens and follow the active theme. Outside one, the
 * form provides its own: with your config if you called createTamagui, with a
 * built-in default config otherwise.
 */
export function SchemaForm<S extends JSONSchema, T = InferSchema<S>>(props: SchemaFormProps<S, T>) {
  const form = createElement(TamaguiSchemaForm<S, T>, props);
  if (useInTamaguiProvider()) return form;
  return createElement(
    TamaguiProvider,
    { config: getProviderConfig(), defaultTheme: 'light' },
    form,
  );
}

/**
 * Tamagui exports no context to probe for a provider; reading the theme throws
 * outside one. A mounted form never gains or loses its provider, so the hooks
 * run in the same order on every render.
 */
function useInTamaguiProvider(): boolean {
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: see above.
    useThemeName();
    return true;
  } catch {
    return false;
  }
}

export {
  ArrayItemTemplate,
  ArrayTemplate,
  FieldLabel,
  FieldTemplate,
  FormTemplate,
  ObjectTemplate,
  SubmitButton,
  tamaguiTemplates,
  UnsupportedField,
} from './templates';
export { CheckboxWidget, SwitchWidget } from './widgets/boolean';
export { CheckboxesWidget, RadioWidget, SelectWidget } from './widgets/choice';
export { NumberWidget, RangeWidget } from './widgets/number';
export {
  DateTimeWidget,
  DateWidget,
  EmailWidget,
  PasswordWidget,
  TextareaWidget,
  TextWidget,
  TimeWidget,
  UrlWidget,
} from './widgets/text';
