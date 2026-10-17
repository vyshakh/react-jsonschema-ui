/** `ui:*` directives, mirroring react-jsonschema-form's uiSchema conventions. */
export interface UiDirectives {
  readonly 'ui:widget'?: string;
  readonly 'ui:field'?: string;
  readonly 'ui:title'?: string;
  readonly 'ui:description'?: string;
  readonly 'ui:placeholder'?: string;
  readonly 'ui:help'?: string;
  readonly 'ui:hidden'?: boolean;
  readonly 'ui:disabled'?: boolean;
  readonly 'ui:readonly'?: boolean;
  readonly 'ui:autofocus'?: boolean;
  /** Property order for objects; `'*'` stands for all unlisted properties. */
  readonly 'ui:order'?: readonly string[];
  readonly 'ui:enumNames'?: readonly string[];
  /** Free-form options forwarded to the widget. */
  readonly 'ui:options'?: Readonly<Record<string, unknown>>;
}

/**
 * uiSchema for a value of type `T`. With a known `T`, nested keys are checked
 * against the value shape; with `unknown` it accepts any nesting.
 */
export type UiSchema<T = unknown> = UiDirectives &
  (unknown extends T
    ? { readonly [key: string]: unknown }
    : T extends readonly (infer E)[]
      ? { readonly items?: UiSchema<E> }
      : T extends object
        ? { readonly [K in keyof T]?: UiSchema<T[K]> }
        : unknown);
