import { type JSONSchema, SchemaForm, type UiSchema } from 'react-jsonschema-ui';
import type { PlaygroundOptions } from '../state';

// The playground's own settings are a SchemaForm too.
const schema = {
  type: 'object',
  properties: {
    validateMode: {
      title: 'Validate',
      oneOf: [
        { const: 'onBlur', title: 'On blur' },
        { const: 'onChange', title: 'On change' },
        { const: 'onSubmit', title: 'On submit' },
      ],
    },
    disabled: { type: 'boolean', title: 'Disabled' },
    readOnly: { type: 'boolean', title: 'Read-only' },
  },
} as const satisfies JSONSchema;

const uiSchema: UiSchema = {
  validateMode: { 'ui:widget': 'radio', 'ui:options': { inline: true } },
  disabled: { 'ui:widget': 'switch' },
  readOnly: { 'ui:widget': 'switch' },
};

export function OptionsPanel({
  options,
  onChange,
}: {
  options: PlaygroundOptions;
  onChange: (options: PlaygroundOptions) => void;
}) {
  return (
    <SchemaForm
      schema={schema}
      uiSchema={uiSchema}
      initialValues={options}
      idPrefix="options"
      onChange={(values) =>
        onChange({
          validateMode: values.validateMode ?? 'onBlur',
          disabled: values.disabled === true,
          readOnly: values.readOnly === true,
        })
      }
    >
      {null}
    </SchemaForm>
  );
}
