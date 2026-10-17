import type { PlaygroundState } from '../state';

const indent = (text: string, spaces: number) => text.replace(/\n/g, `\n${' '.repeat(spaces)}`);

const isEmpty = (value: unknown) =>
  value === undefined ||
  (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

/** Usage snippet mirroring the playground's current state. */
export function generateCode(state: PlaygroundState): string {
  const { schema, uiSchema, formData, options, sample } = state;
  const hasUi = !isEmpty(uiSchema.value);
  const hasData = !isEmpty(formData.value);

  const props = [
    'schema={schema}',
    hasUi && 'uiSchema={uiSchema}',
    hasData && 'initialValues={initialValues}',
    sample?.registry && 'registry={registry}',
    options.validateMode !== 'onBlur' && `validateMode="${options.validateMode}"`,
    options.disabled && 'disabled',
    options.readOnly && 'readOnly',
    'onSubmit={(values) => console.log(values)}',
  ].filter(Boolean);

  return [
    `import { SchemaForm${hasUi ? ', type UiSchema' : ''} } from 'react-jsonschema-ui';`,
    sample?.registrySnippet ? `\n${sample.registrySnippet}` : '',
    '',
    `const schema = ${JSON.stringify(schema.value, null, 2)} as const;`,
    hasUi ? `\nconst uiSchema: UiSchema = ${JSON.stringify(uiSchema.value, null, 2)};` : '',
    hasData ? `\nconst initialValues = ${JSON.stringify(formData.value, null, 2)};` : '',
    '',
    '// Render inside your <TamaguiProvider>. The same component runs on',
    '// React Native (Expo) and the web.',
    'export function MyForm() {',
    '  return (',
    `    <SchemaForm\n      ${indent(props.join('\n'), 6)}\n    />`,
    '  );',
    '}',
    '',
  ]
    .filter((line, i, lines) => !(line === '' && lines[i - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
