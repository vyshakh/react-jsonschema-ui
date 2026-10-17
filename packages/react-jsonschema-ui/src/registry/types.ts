import type { ComponentType, ReactNode } from 'react';
import type { ArrayFieldNode, EnumOption, FieldNode, ObjectFieldNode } from '../parser/parse';
import type { JsonPointer } from '../utils/pointer';

/**
 * Value type each built-in widget name works with. Augment it to type your
 * own widgets:
 *
 *   declare module 'react-jsonschema-ui' {
 *     interface WidgetValueMap { rating: number | undefined }
 *   }
 */
export interface WidgetValueMap {
  text: string | undefined;
  textarea: string | undefined;
  password: string | undefined;
  email: string | undefined;
  url: string | undefined;
  date: string | undefined;
  datetime: string | undefined;
  time: string | undefined;
  number: number | undefined;
  range: number | undefined;
  checkbox: boolean | undefined;
  switch: boolean | undefined;
  select: unknown;
  radio: unknown;
  /** Multi-select over an array of enum items. */
  checkboxes: unknown[] | undefined;
}

export interface WidgetProps<V = unknown> {
  /** Stable element id derived from the pointer, e.g. `root_address_city`. */
  readonly id: string;
  readonly pointer: JsonPointer;
  /** A leaf node, or an array node rendered by an explicit `ui:widget`. */
  readonly node: FieldNode;
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly onBlur: () => void;
  readonly label: string | undefined;
  readonly placeholder: string | undefined;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly autofocus: boolean;
  readonly errors: readonly string[] | undefined;
  readonly touched: boolean;
  /** The node's enum options; for array widgets, those of its items. */
  readonly enumOptions: readonly EnumOption[] | undefined;
  /** `ui:options` from the uiSchema. */
  readonly options: Readonly<Record<string, unknown>>;
}

export type Widget<V = unknown> = ComponentType<WidgetProps<V>>;

export type WidgetRegistry = {
  readonly [K in keyof WidgetValueMap]?: Widget<WidgetValueMap[K]>;
} & {
  // biome-ignore lint/suspicious/noExplicitAny: custom widgets choose their own value type.
  readonly [name: string]: Widget<any> | undefined;
};

/** Props of a `ui:field` component, which takes over rendering of a whole subtree. */
export interface FieldProps {
  readonly pointer: JsonPointer;
  readonly node: FieldNode;
}

export type FieldComponent = ComponentType<FieldProps>;

export interface FormTemplateProps {
  readonly children: ReactNode;
  readonly onSubmit: () => void;
  readonly disabled: boolean;
}

/** Wraps every leaf widget: label, description, help and errors. */
export interface FieldTemplateProps {
  readonly id: string;
  readonly pointer: JsonPointer;
  readonly node: FieldNode;
  readonly label: string | undefined;
  readonly description: string | undefined;
  readonly help: string | undefined;
  readonly required: boolean;
  readonly errors: readonly string[] | undefined;
  readonly touched: boolean;
  readonly children: ReactNode;
}

export interface ObjectProperty {
  readonly name: string;
  readonly pointer: JsonPointer;
  readonly node: FieldNode;
  /** The rendered child field. */
  readonly content: ReactNode;
}

/** Lays out an object's properties. Grid and section layouts plug in here. */
export interface ObjectTemplateProps {
  readonly id: string;
  readonly pointer: JsonPointer;
  readonly node: ObjectFieldNode;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly required: boolean;
  /** Object-level errors (e.g. `minProperties`); child errors live on the children. */
  readonly errors: readonly string[] | undefined;
  readonly properties: readonly ObjectProperty[];
}

export interface ArrayTemplateProps {
  readonly id: string;
  readonly pointer: JsonPointer;
  readonly node: ArrayFieldNode;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly required: boolean;
  readonly errors: readonly string[] | undefined;
  /** Keyed `ArrayItemTemplate` elements, ready to render as-is. */
  readonly items: readonly ReactNode[];
  readonly canAdd: boolean;
  readonly onAdd: () => void;
}

export interface ArrayItemTemplateProps {
  readonly id: string;
  readonly pointer: JsonPointer;
  readonly index: number;
  readonly length: number;
  /** The array's item node. */
  readonly node: FieldNode;
  readonly children: ReactNode;
  readonly canRemove: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onRemove: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
}

export interface SubmitButtonProps {
  readonly label: string;
  readonly disabled: boolean;
  readonly onSubmit: () => void;
}

export interface UnsupportedFieldProps {
  readonly pointer: JsonPointer;
  readonly node: FieldNode;
  readonly reason: string;
}

export interface Templates {
  readonly FormTemplate: ComponentType<FormTemplateProps>;
  readonly FieldTemplate: ComponentType<FieldTemplateProps>;
  readonly ObjectTemplate: ComponentType<ObjectTemplateProps>;
  readonly ArrayTemplate: ComponentType<ArrayTemplateProps>;
  readonly ArrayItemTemplate: ComponentType<ArrayItemTemplateProps>;
  readonly SubmitButton: ComponentType<SubmitButtonProps>;
  readonly UnsupportedField: ComponentType<UnsupportedFieldProps>;
}

export interface Registry {
  readonly widgets: WidgetRegistry;
  readonly fields: Readonly<Record<string, FieldComponent | undefined>>;
  readonly templates: Templates;
}

export interface RegistryOverrides {
  readonly widgets?: WidgetRegistry;
  readonly fields?: Readonly<Record<string, FieldComponent | undefined>>;
  readonly templates?: Partial<Templates>;
}
