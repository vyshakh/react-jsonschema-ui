import { headlessRegistry, mergeRegistry } from '../registry/registry';
import type { Registry } from '../registry/types';
import { createSchemaForm } from '../renderer/SchemaForm';
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

/**
 * `<SchemaForm>` rendered with Tamagui. Render it inside your app's
 * `<TamaguiProvider>`; widgets use theme tokens and follow the active theme.
 */
export const SchemaForm = createSchemaForm(tamaguiRegistry);

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
