# react-jsonschema-ui

[![npm](https://img.shields.io/npm/v/react-jsonschema-ui)](https://www.npmjs.com/package/react-jsonschema-ui)
[![license](https://img.shields.io/npm/l/react-jsonschema-ui)](./LICENSE)

JSON Schema forms for **React Native (iOS / Android via Expo)** and **React on the web**, from one
component. Rendered with [Tamagui](https://tamagui.dev), with state in
[Zustand](https://zustand.docs.pmnd.rs) and validation by [Ajv](https://ajv.js.org).

**[Live playground →](https://vyshakh.github.io/react-jsonschema-ui/)**

<p align="center">
  <img src="https://raw.githubusercontent.com/vyshakh/react-jsonschema-ui/main/screenshots/home.png" width="200" alt="Sample list in the Expo app on iOS">
  <img src="https://raw.githubusercontent.com/vyshakh/react-jsonschema-ui/main/screenshots/widgets.png" width="200" alt="Widgets sample on iOS">
  <img src="https://raw.githubusercontent.com/vyshakh/react-jsonschema-ui/main/screenshots/enums.png" width="200" alt="Enums sample on iOS">
  <img src="https://raw.githubusercontent.com/vyshakh/react-jsonschema-ui/main/screenshots/validations.png" width="200" alt="Validation errors on iOS">
</p>

- **Universal** — the same `<SchemaForm>` runs on iOS, Android and the web.
- **Fast** — each field subscribes to its own slice of state; typing in one field never
  re-renders another.
- **Typed** — values are inferred from `as const` schemas; uiSchema keys and custom widget values
  are checked.
- **Extensible** — override any widget, field or layout template; or use the headless core with
  your own components.

## Install

```sh
npm install react-jsonschema-ui tamagui
```

Your app provides `react` (19+ when using the Tamagui widgets), `tamagui` (^2.7) and, on native,
`react-native` / Expo. Ajv, ajv-formats and Zustand come with the package.

## Quick start

Render `<SchemaForm>` inside your app's `<TamaguiProvider>`:

```tsx
import { SchemaForm, type UiSchema } from 'react-jsonschema-ui';

const schema = {
  title: 'Sign up',
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', title: 'Name', minLength: 2 },
    email: { type: 'string', title: 'Email', format: 'email' },
    plan: { type: 'string', title: 'Plan', enum: ['free', 'pro'], default: 'free' },
    newsletter: { type: 'boolean', title: 'Send me updates' },
  },
} as const;

const uiSchema: UiSchema = {
  newsletter: { 'ui:widget': 'switch' },
};

export function SignUp() {
  return (
    <SchemaForm
      schema={schema}
      uiSchema={uiSchema}
      // values: { name: string; email: string; plan?: 'free' | 'pro'; newsletter?: boolean }
      onSubmit={(values) => save(values)}
    />
  );
}
```

`<SchemaForm>` is uncontrolled: `initialValues` (merged with schema `default`s) are read when the
form is created. Keep `schema` and `uiSchema` referentially stable (module constants or `useMemo`) —
a new object identity rebuilds the form and resets its state.

### Props

| Prop | Description |
| --- | --- |
| `schema` | JSON Schema (draft-07 / 2019-09 / 2020-12 keywords). |
| `uiSchema` | Presentation hints, see below. |
| `initialValues` | Starting values, merged with schema defaults. |
| `onSubmit(values)` | Called with valid values. |
| `onError(errors)` | Called when a submit fails validation, with `{ [pointer]: messages }`. |
| `onChange(values)` | Called on every change. |
| `validateMode` | `'onBlur'` (default), `'onChange'` or `'onSubmit'`, before the first submit. |
| `reValidateMode` | `'onChange'` (default) or `'onBlur'`, after the first submit. |
| `registry` | Extra or replacement `widgets`, `fields` and `templates`. |
| `validator` | A custom validator (default: Ajv with ajv-formats). |
| `store` | An external store from `createFormStore`, to read or drive the form from outside. |
| `disabled`, `readOnly` | Apply to every field. |
| `idPrefix` | Prefix for element ids (default `root`, e.g. `root_address_city`). |
| `submitLabel` / `children` | Label of the default submit button, or replace it (`null` hides it). |

Errors are shown per field: in the default `onBlur` mode a field is validated when it loses focus,
then live while it has errors; submitting validates everything.

## uiSchema

| Directive | Effect |
| --- | --- |
| `ui:widget` | Pick a widget by name (see below). |
| `ui:field` | Replace the whole field with a registered field component. |
| `ui:title`, `ui:description`, `ui:help`, `ui:placeholder` | Text shown around the input. |
| `ui:order` | Property order; `'*'` stands for the rest. |
| `ui:enumNames` | Labels for `enum` values. |
| `ui:hidden`, `ui:disabled`, `ui:readonly`, `ui:autofocus` | Field state. |
| `ui:options` | Widget options, e.g. `{ rows: 5 }` for textareas, `{ inline: true }` for radios, `{ addable, removable, orderable }` for arrays. |

Nested properties use nested keys, and array items use `items`:
`{ tasks: { items: { details: { 'ui:widget': 'textarea' } } } }`.

## Widgets

| Widget | Chosen for |
| --- | --- |
| `text`, `email`, `url`, `password`, `textarea` | `string` (by `format` / `ui:widget`) |
| `date`, `datetime`, `time` | `format: date / date-time / time` (values stay valid RFC 3339) |
| `number`, `range` | `number`, `integer` |
| `checkbox`, `switch` | `boolean` |
| `select`, `radio` | `enum`, or `oneOf` of `{ const, title }` |
| `checkboxes` | arrays of enum values with `uniqueItems` |

On native, `select` opens a bottom sheet. Date and time widgets are text inputs on native; register a
native picker as a custom widget if you want one.

## Custom widgets

A widget receives the field's value and callbacks, never the store:

```tsx
import type { WidgetProps } from 'react-jsonschema-ui';
import { Button, XStack } from 'tamagui';

function RatingWidget({ value, onChange, onBlur, node }: WidgetProps<number | undefined>) {
  const max = node.schema.maximum ?? 5;
  return (
    <XStack>
      {Array.from({ length: max }, (_, i) => (
        <Button key={i} chromeless onPress={() => { onChange(i + 1); onBlur(); }}>
          {i < (value ?? 0) ? '★' : '☆'}
        </Button>
      ))}
    </XStack>
  );
}

<SchemaForm
  schema={schema}
  uiSchema={{ stars: { 'ui:widget': 'rating' } }}
  registry={{ widgets: { rating: RatingWidget } }}
/>;
```

Type your widget names by augmenting `WidgetValueMap`:

```ts
declare module 'react-jsonschema-ui' {
  interface WidgetValueMap {
    rating: number | undefined;
  }
}
```

Layout is overridable too: `FormTemplate`, `FieldTemplate`, `ObjectTemplate`, `ArrayTemplate`,
`ArrayItemTemplate`, `SubmitButton` and `UnsupportedField` can all be replaced through
`registry.templates`.

## Headless core

`react-jsonschema-ui/core` contains the parser, validator, store and React bindings without any
Tamagui import. Build a form with your own components:

```tsx
import { SchemaForm, useField } from 'react-jsonschema-ui/core';

<SchemaForm schema={schema} registry={{ widgets: myWidgets, templates: myTemplates }} />;
```

Or skip the renderer and use the store and hooks directly — `createFormStore`, `useField(pointer)`,
`useArrayField(pointer)` and `useFormSelector` — with fields addressed by JSON Pointer
(`/address/city`, `/tasks/0/title`).

## Tamagui setup notes

- Widgets use theme tokens (`$background`, `$borderColor`, `$color10`, `$placeholderColor`) and
  follow your app's light/dark themes. The defaults from `@tamagui/config` work out of the box.
- The `@tamagui/config/v5` preset only allows shorthand style props *in its types*. The library
  uses longhand props (they work with every config); if you type-check this package's source,
  set `settings: { ...defaultConfig.settings, onlyAllowShorthands: false }`.

## JSON Schema support

Supported: `type` (including `['x', 'null']`), `properties`, `required`, `enum`, `const`,
`default`, `items`, `minItems` / `maxItems`, `uniqueItems`, string and number constraints,
`format` (via ajv-formats), local `$ref` (`$defs` / `definitions`, recursive schemas), `allOf`,
`oneOf` / `anyOf` of `const` values as labelled options.

Validated but not yet rendered specially: `oneOf` / `anyOf` sub-schema selection,
`if` / `then` / `else`, `dependentSchemas` / `dependencies`, tuple `items` / `prefixItems`,
`additionalProperties`.

Validation uses Ajv, which works on Hermes (verified on iOS with Expo SDK 57). If your runtime
forbids `new Function`, precompile with Ajv standalone code and pass
`fromAjvValidateFunction(validate)` as `validator`.

## Development

This is a pnpm + Turborepo monorepo:

| Path | Contents |
| --- | --- |
| `packages/react-jsonschema-ui` | the published package |
| `packages/samples` | sample schemas shared by the playground and the app |
| `docs` | Vite playground, deployed to GitHub Pages |
| `example` | Expo (SDK 57) app showing every sample on iOS / Android |

```sh
pnpm install
pnpm test        # unit, render and type tests
pnpm typecheck
pnpm lint
pnpm build
pnpm docs        # playground at http://localhost:5173
pnpm --filter example start   # Expo dev server
```

The playground and the Expo app compile the library from source, so changes show up without a
rebuild.

## Author

Hi there! I'm [Vyshakh Parakkat](https://www.linkedin.com/in/vyshakhparakkat/). My expertise lies in
crafting robust solutions using React Native, ReactJS, Kubernetes and Python.

If you have any questions, suggestions, or just want to connect, feel free to reach out.

Happy coding! 🚀

## License

[MIT](./LICENSE)
