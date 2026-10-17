// Headless engine: schema parsing, validation, state and React bindings.
// Imports nothing UI-specific, so it runs unchanged on web and React Native.

export { getDefaultValues } from './parser/defaults';
export {
  type ArrayFieldNode,
  type EnumOption,
  type FieldKind,
  type FieldNode,
  getNodeAt,
  type LeafFieldNode,
  type ObjectFieldNode,
  parseSchema,
} from './parser/parse';
export { createResolver, type SchemaResolver } from './parser/resolve';
export { FormStoreProvider, useFormStore } from './react/context';
export {
  type ArrayFieldBinding,
  type FieldBinding,
  useArrayField,
  useCreateFormStore,
  useField,
  useFormSelector,
} from './react/hooks';
export {
  headlessRegistry,
  mergeRegistry,
  RegistryProvider,
  useRegistry,
} from './registry/registry';
export type {
  ArrayItemTemplateProps,
  ArrayTemplateProps,
  FieldComponent,
  FieldProps,
  FieldTemplateProps,
  FormTemplateProps,
  ObjectProperty,
  ObjectTemplateProps,
  Registry,
  RegistryOverrides,
  SubmitButtonProps,
  Templates,
  UnsupportedFieldProps,
  Widget,
  WidgetProps,
  WidgetRegistry,
  WidgetValueMap,
} from './registry/types';
export {
  type FormConfig,
  toFieldId,
  useFormConfig,
  useFormSubmit,
} from './renderer/context';
export { SchemaField, type SchemaFieldProps } from './renderer/SchemaField';
export { createSchemaForm, SchemaForm, type SchemaFormProps } from './renderer/SchemaForm';
export type { DeepPartial, InferSchema } from './schema/infer';
export type {
  JSONSchema,
  JSONSchemaDefinition,
  JSONSchemaTypeName,
  JSONValue,
} from './schema/types';
export type { UiDirectives, UiSchema } from './schema/ui';
export {
  createFormStore,
  type FormActions,
  type FormState,
  type FormStore,
  type FormStoreOptions,
  type FormStoreState,
  resolveItemKeys,
  type ValidateMode,
} from './store/createFormStore';
export {
  escapeToken,
  getIn,
  isWithin,
  type JsonPointer,
  joinPointer,
  parsePointer,
  ROOT_POINTER,
  setIn,
  unescapeToken,
} from './utils/pointer';
export {
  type AjvValidateFunction,
  type AjvValidatorOptions,
  createAjvValidator,
  fromAjvValidateFunction,
} from './validation/ajv';
export { EMPTY_ERRORS, toErrorMap } from './validation/errors';
export type { ErrorMap, FieldError, SchemaValidator, ValidationResult } from './validation/types';
