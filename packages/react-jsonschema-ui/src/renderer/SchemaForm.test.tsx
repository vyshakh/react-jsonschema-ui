// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FieldProps, RegistryOverrides, Widget } from '../registry/types';
import type { JSONSchema } from '../schema/types';
import { createFormStore } from '../store/createFormStore';
import { SchemaForm } from './SchemaForm';

afterEach(cleanup);

const renders = new Map<string, number>();

const TextWidget: Widget<string | undefined> = ({ id, value, onChange, onBlur, label }) => {
  renders.set(id, (renders.get(id) ?? 0) + 1);
  return (
    <input
      id={id}
      aria-label={label ?? id}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || undefined)}
      onBlur={onBlur}
    />
  );
};

const CheckboxWidget: Widget<boolean | undefined> = ({ id, value, onChange, label }) => (
  <input
    id={id}
    type="checkbox"
    aria-label={label ?? id}
    checked={value === true}
    onChange={(event) => onChange(event.target.checked)}
  />
);

const SelectWidget: Widget = ({ id, value, onChange, enumOptions, label }) => (
  <select
    id={id}
    aria-label={label ?? id}
    value={String(enumOptions?.findIndex((option) => option.value === value) ?? -1)}
    onChange={(event) => onChange(enumOptions?.[Number(event.target.value)]?.value)}
  >
    <option value="-1">-</option>
    {enumOptions?.map((option, i) => (
      <option key={option.label} value={String(i)}>
        {option.label}
      </option>
    ))}
  </select>
);

const registry: RegistryOverrides = {
  widgets: { text: TextWidget, email: TextWidget, checkbox: CheckboxWidget, select: SelectWidget },
  templates: {
    FormTemplate: ({ children, onSubmit }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
      </form>
    ),
    FieldTemplate: ({ id, children, errors }) => (
      <div>
        {children}
        {errors?.map((error) => (
          <p key={error} data-testid={`${id}-error`}>
            {error}
          </p>
        ))}
      </div>
    ),
    ArrayTemplate: ({ items, canAdd, onAdd }) => (
      <div>
        {items}
        <button type="button" disabled={!canAdd} onClick={onAdd}>
          add
        </button>
      </div>
    ),
    ArrayItemTemplate: ({ id, children, onRemove, canRemove }) => (
      <div>
        {children}
        <button type="button" disabled={!canRemove} onClick={onRemove}>
          {`remove ${id}`}
        </button>
      </div>
    ),
    SubmitButton: ({ label }) => <button type="submit">{label}</button>,
    UnsupportedField: ({ reason }) => <p>{reason}</p>,
  },
};

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    agree: { type: 'boolean' },
    size: { type: 'string', enum: ['s', 'm', 'l'] },
  },
} as const satisfies JSONSchema;

const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe('<SchemaForm>', () => {
  it('renders widgets per field with pointer-derived ids', () => {
    render(<SchemaForm schema={schema} registry={registry} />);
    expect(input('name').id).toBe('root_name');
    expect(input('agree').type).toBe('checkbox');
    expect(screen.getByLabelText('size').tagName).toBe('SELECT');
  });

  it('submits valid values and reports errors otherwise', () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    render(
      <SchemaForm schema={schema} registry={registry} onSubmit={onSubmit} onError={onError} />,
    );

    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      '/name': ['is a required property'],
      '/email': ['is a required property'],
    });
    expect(screen.getByTestId('root_name-error').textContent).toBe('is a required property');

    fireEvent.change(input('name'), { target: { value: 'Ada' } });
    fireEvent.change(input('email'), { target: { value: 'ada@example.com' } });
    fireEvent.click(input('agree'));
    fireEvent.change(screen.getByLabelText('size'), { target: { value: '1' } });
    expect(screen.queryByTestId('root_name-error')).toBeNull();

    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      agree: true,
      size: 'm',
    });
  });

  it('re-renders only the field that changed', () => {
    renders.clear();
    render(<SchemaForm schema={schema} registry={registry} />);
    const before = renders.get('root_email');
    fireEvent.change(input('name'), { target: { value: 'A' } });
    fireEvent.change(input('name'), { target: { value: 'Ad' } });
    expect(renders.get('root_email')).toBe(before);
    expect(renders.get('root_name')).toBe((before ?? 0) + 2);
  });

  it('keeps item components attached to their items across removal', () => {
    const listSchema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
    } as const;
    render(
      <SchemaForm schema={listSchema} registry={registry} initialValues={{ tags: ['a', 'b'] }} />,
    );
    const second = screen.getByDisplayValue('b');
    fireEvent.click(screen.getByText('remove root_tags_0'));
    expect(screen.getByDisplayValue('b')).toBe(second);
    expect(second.id).toBe('root_tags_0');

    fireEvent.click(screen.getByText('add'));
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('honours ui:hidden, ui:field and missing widgets', () => {
    const Custom = vi.fn((_props: FieldProps) => <p>custom field</p>);
    render(
      <SchemaForm
        schema={{
          type: 'object',
          properties: {
            secret: { type: 'string' },
            fancy: { type: 'string' },
            amount: { type: 'number' },
          },
        }}
        uiSchema={{ secret: { 'ui:hidden': true }, fancy: { 'ui:field': 'fancy' } }}
        registry={{ ...registry, fields: { fancy: Custom } }}
      />,
    );
    expect(screen.queryByLabelText('secret')).toBeNull();
    expect(screen.getByText('custom field')).toBeTruthy();
    expect(Custom.mock.calls[0]?.[0]).toMatchObject({ pointer: '/fancy' });
    expect(screen.getByText('No widget registered for "number"')).toBeTruthy();
  });

  it('renders no submit button when children is null', () => {
    render(
      <SchemaForm schema={schema} registry={registry}>
        {null}
      </SchemaForm>,
    );
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('works with an external store and reports changes', () => {
    const onChange = vi.fn();
    const store = createFormStore({ schema });
    render(<SchemaForm schema={schema} registry={registry} store={store} onChange={onChange} />);
    act(() => store.getState().setValue('/name', 'Grace'));
    expect(input('name').value).toBe('Grace');
    expect(onChange).toHaveBeenLastCalledWith({ name: 'Grace' });
  });
});
