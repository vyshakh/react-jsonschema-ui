import type { JSONSchema, RegistryOverrides, UiSchema } from 'react-jsonschema-ui';
import { RatingWidget } from './rating-widget';

export interface Sample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly schema: JSONSchema;
  readonly uiSchema?: UiSchema;
  readonly formData?: unknown;
  /** Extra widgets/templates this sample needs; shown in the code preview. */
  readonly registry?: RegistryOverrides;
  readonly registrySnippet?: string;
}

export const samples: readonly Sample[] = [
  {
    id: 'simple',
    title: 'Simple',
    description: 'A flat object with required fields, string formats and validation keywords.',
    schema: {
      title: 'A registration form',
      description: 'A simple form example.',
      type: 'object',
      required: ['firstName', 'lastName'],
      properties: {
        firstName: { type: 'string', title: 'First name', default: 'Chuck' },
        lastName: { type: 'string', title: 'Last name' },
        age: { type: 'integer', title: 'Age', minimum: 0 },
        bio: { type: 'string', title: 'Bio' },
        password: { type: 'string', title: 'Password', minLength: 3 },
        telephone: { type: 'string', title: 'Telephone', minLength: 10 },
      },
    },
    uiSchema: {
      firstName: { 'ui:autofocus': true },
      age: { 'ui:help': 'Hint: you can leave this blank.' },
      bio: { 'ui:widget': 'textarea' },
      password: { 'ui:widget': 'password', 'ui:help': 'Hint: make it strong!' },
      telephone: { 'ui:placeholder': '+1 555 0100' },
    },
    formData: { lastName: 'Norris', age: 75, bio: 'Roundhouse kicking asses since 1940' },
  },
  {
    id: 'widgets',
    title: 'Widgets',
    description: 'Every built-in Tamagui widget, selected by type, format or ui:widget.',
    schema: {
      title: 'Widgets',
      type: 'object',
      properties: {
        stringFormats: {
          type: 'object',
          title: 'String formats',
          properties: {
            email: { type: 'string', format: 'email' },
            uri: { type: 'string', format: 'uri' },
          },
        },
        boolean: {
          type: 'object',
          title: 'Boolean field',
          properties: {
            default: { type: 'boolean', title: 'checkbox (default)' },
            switch: { type: 'boolean', title: 'switch' },
          },
        },
        string: {
          type: 'object',
          title: 'String field',
          properties: {
            default: { type: 'string', title: 'text input (default)' },
            textarea: { type: 'string', title: 'textarea' },
            placeholder: { type: 'string' },
          },
        },
        number: {
          type: 'object',
          title: 'Number field',
          properties: {
            default: { type: 'number', title: 'number input (default)' },
            range: { type: 'integer', title: 'range', minimum: 0, maximum: 100, multipleOf: 5 },
          },
        },
        choice: {
          type: 'object',
          title: 'Choices',
          properties: {
            select: { type: 'string', title: 'select (default)', enum: ['foo', 'bar', 'baz'] },
            radio: { type: 'string', title: 'radio', enum: ['foo', 'bar', 'baz'] },
            checkboxes: {
              type: 'array',
              title: 'checkboxes',
              uniqueItems: true,
              items: { type: 'string', enum: ['foo', 'bar', 'baz'] },
            },
          },
        },
        dates: {
          type: 'object',
          title: 'Dates',
          properties: {
            date: { type: 'string', format: 'date' },
            datetime: { type: 'string', format: 'date-time' },
            time: { type: 'string', format: 'time' },
          },
        },
        disabled: { type: 'string', title: 'A disabled field', default: 'I am disabled.' },
        readonly: { type: 'string', title: 'A readonly field', default: 'I am read-only.' },
      },
    },
    uiSchema: {
      boolean: { switch: { 'ui:widget': 'switch' } },
      string: {
        textarea: { 'ui:widget': 'textarea', 'ui:options': { rows: 5 } },
        placeholder: { 'ui:placeholder': 'This is a placeholder' },
      },
      number: { range: { 'ui:widget': 'range' } },
      choice: { radio: { 'ui:widget': 'radio', 'ui:options': { inline: true } } },
      disabled: { 'ui:disabled': true },
      readonly: { 'ui:readonly': true },
    },
    formData: { choice: { checkboxes: ['bar'] } },
  },
  {
    id: 'nested',
    title: 'Nested',
    description: 'Objects inside objects, and arrays of objects.',
    schema: {
      title: 'A list of tasks',
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', title: 'Task list title' },
        tasks: {
          type: 'array',
          title: 'Tasks',
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              title: { type: 'string', title: 'Title', description: 'A sample title' },
              details: {
                type: 'string',
                title: 'Task details',
                description: 'Enter the task details',
              },
              done: { type: 'boolean', title: 'Done?', default: false },
            },
          },
        },
      },
    },
    uiSchema: { tasks: { items: { details: { 'ui:widget': 'textarea' } } } },
    formData: {
      title: 'My current tasks',
      tasks: [
        { title: 'My first task', details: 'Write the schema parser.', done: true },
        { title: 'My second task', details: 'Ship the Tamagui widgets.', done: false },
      ],
    },
  },
  {
    id: 'arrays',
    title: 'Arrays',
    description:
      'Add, remove and reorder items; minItems/maxItems and ui:options control the buttons.',
    schema: {
      type: 'object',
      properties: {
        listOfStrings: {
          type: 'array',
          title: 'A list of strings',
          items: { type: 'string', default: 'bazinga' },
        },
        minItemsList: {
          type: 'array',
          title: 'A list with a minimal number of items',
          minItems: 3,
          items: {
            type: 'object',
            properties: { name: { type: 'string', default: 'Default name' } },
          },
        },
        boundedList: {
          type: 'array',
          title: 'At most three numbers',
          maxItems: 3,
          items: { type: 'number' },
        },
        fixedList: {
          type: 'array',
          title: 'Not orderable or removable',
          items: { type: 'string' },
        },
      },
    },
    uiSchema: {
      fixedList: { 'ui:options': { orderable: false, removable: false } },
    },
    formData: { listOfStrings: ['foo', 'bar'], boundedList: [1, 2], fixedList: ['locked'] },
  },
  {
    id: 'numbers',
    title: 'Numbers',
    description: 'number vs integer, bounds, multipleOf and enums of numbers.',
    schema: {
      type: 'object',
      title: 'Number fields & widgets',
      properties: {
        number: { title: 'Number', type: 'number' },
        integer: { title: 'Integer', type: 'integer' },
        numberEnum: { type: 'number', title: 'Number enum', enum: [1, 2, 3] },
        integerRange: { title: 'Integer range', type: 'integer', minimum: -50, maximum: 50 },
        integerRangeSteps: {
          title: 'Integer range (by 10)',
          type: 'integer',
          minimum: 50,
          maximum: 100,
          multipleOf: 10,
        },
      },
    },
    uiSchema: {
      integerRange: { 'ui:widget': 'range' },
      integerRangeSteps: { 'ui:widget': 'range' },
      numberEnum: { 'ui:widget': 'radio', 'ui:options': { inline: true } },
    },
    formData: { number: 3.14, integer: 42, numberEnum: 2, integerRange: 42, integerRangeSteps: 80 },
  },
  {
    id: 'enums',
    title: 'Enums',
    description: 'Plain enums, labelled enums via ui:enumNames, and oneOf with const + title.',
    schema: {
      type: 'object',
      properties: {
        plain: { type: 'string', title: 'Plain enum', enum: ['#ff0000', '#00ff00', '#0000ff'] },
        named: {
          type: 'string',
          title: 'Named with ui:enumNames',
          enum: ['#ff0000', '#00ff00', '#0000ff'],
        },
        oneOf: {
          title: 'oneOf with const & title',
          oneOf: [
            { const: 'sm', title: 'Small' },
            { const: 'md', title: 'Medium' },
            { const: 'lg', title: 'Large' },
          ],
        },
        mixed: { title: 'Mixed value types', enum: [1, 'two', true, null] },
      },
    },
    uiSchema: { named: { 'ui:enumNames': ['Red', 'Green', 'Blue'] } },
    formData: { oneOf: 'md' },
  },
  {
    id: 'references',
    title: 'References',
    description: '$ref into $defs, ref siblings overriding the target, and allOf composition.',
    schema: {
      $defs: {
        address: {
          type: 'object',
          required: ['street', 'city'],
          properties: {
            street: { type: 'string', title: 'Street' },
            city: { type: 'string', title: 'City' },
            state: { type: 'string', title: 'State' },
          },
        },
        timestamps: {
          properties: { createdAt: { type: 'string', format: 'date', title: 'Created' } },
        },
      },
      type: 'object',
      allOf: [{ $ref: '#/$defs/timestamps' }],
      properties: {
        billing: { $ref: '#/$defs/address', title: 'Billing address' },
        shipping: { $ref: '#/$defs/address', title: 'Shipping address' },
      },
    },
    formData: { billing: { street: '21, Jump Street', city: 'Babel' } },
  },
  {
    id: 'recursive',
    title: 'Recursive',
    description: 'A self-referencing schema; children are parsed lazily, one level at a time.',
    schema: {
      $defs: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            children: { type: 'array', title: 'Children', items: { $ref: '#/$defs/person' } },
          },
        },
      },
      title: 'Family tree',
      $ref: '#/$defs/person',
    },
    formData: { name: 'Ada', children: [{ name: 'Byron', children: [] }] },
  },
  {
    id: 'validation',
    title: 'Validation',
    description: 'Field errors appear on blur, then live; submitting reveals everything.',
    schema: {
      title: 'Custom validation',
      type: 'object',
      required: ['username', 'email', 'pass1', 'pass2', 'terms'],
      properties: {
        username: {
          type: 'string',
          title: 'Username',
          minLength: 3,
          maxLength: 16,
          pattern: '^[a-z0-9_]+$',
        },
        email: { type: 'string', title: 'Email', format: 'email' },
        pass1: { type: 'string', title: 'Password', minLength: 8 },
        pass2: { type: 'string', title: 'Repeat password', minLength: 8 },
        age: { type: 'integer', title: 'Age', minimum: 18, maximum: 120 },
        website: { type: 'string', title: 'Website', format: 'uri' },
        terms: { type: 'boolean', title: 'I accept the terms', const: true },
      },
    },
    uiSchema: {
      username: { 'ui:help': 'Lowercase letters, digits and underscores.' },
      pass1: { 'ui:widget': 'password' },
      pass2: { 'ui:widget': 'password' },
    },
    formData: { username: 'Ab', age: 12 },
  },
  {
    id: 'custom-widget',
    title: 'Custom widget',
    description: 'Register your own widget and select it with ui:widget.',
    schema: {
      title: 'Movie review',
      type: 'object',
      required: ['movie', 'stars'],
      properties: {
        movie: { type: 'string', title: 'Movie' },
        stars: { type: 'integer', title: 'Rating', minimum: 1, maximum: 5 },
        review: { type: 'string', title: 'Review' },
      },
    },
    uiSchema: {
      stars: { 'ui:widget': 'rating' },
      review: { 'ui:widget': 'textarea' },
    },
    formData: { movie: 'Arrival', stars: 4 },
    registry: { widgets: { rating: RatingWidget } },
    registrySnippet: `import { XStack, Button } from 'tamagui';
import type { WidgetProps } from 'react-jsonschema-ui';

function RatingWidget({ value, onChange, onBlur, node }: WidgetProps<number | undefined>) {
  const max = node.schema.maximum ?? 5;
  return (
    <XStack gap="$1">
      {Array.from({ length: max }, (_, i) => (
        <Button key={i} chromeless onPress={() => { onChange(i + 1); onBlur(); }}>
          {i < (value ?? 0) ? '★' : '☆'}
        </Button>
      ))}
    </XStack>
  );
}

const registry = { widgets: { rating: RatingWidget } };`,
  },
];

export const sampleById = new Map(samples.map((sample) => [sample.id, sample]));
