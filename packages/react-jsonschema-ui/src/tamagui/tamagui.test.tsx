// @vitest-environment jsdom
import { defaultConfig } from '@tamagui/config/v5';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createTamagui, TamaguiProvider } from 'tamagui';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InferSchema } from '../schema/infer';
import type { JSONSchema } from '../schema/types';
import { createFormStore } from '../store/createFormStore';
import { createAjvValidator } from '../validation/ajv';
import { SchemaForm } from './index';
import { isoToLocal, localToFullTime, localToIso } from './widgets/text';

const config = createTamagui(defaultConfig);

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <TamaguiProvider config={config} defaultTheme="light">
      {ui}
    </TamaguiProvider>,
  );

const schema = {
  type: 'object',
  title: 'Profile',
  required: ['name'],
  properties: {
    name: { type: 'string', title: 'Name', minLength: 2 },
    bio: { type: 'string', title: 'Bio' },
    email: { type: 'string', title: 'Email', format: 'email' },
    age: { type: 'integer', title: 'Age', minimum: 0 },
    score: { type: 'number', title: 'Score', minimum: 0, maximum: 10 },
    subscribed: { type: 'boolean', title: 'Subscribed' },
    newsletter: { type: 'boolean', title: 'Newsletter' },
    plan: { type: 'string', title: 'Plan', enum: ['free', 'pro'] },
    size: { type: 'string', title: 'Size', enum: ['s', 'm', 'l'] },
    topics: {
      type: 'array',
      title: 'Topics',
      uniqueItems: true,
      items: { type: 'string', enum: ['news', 'tips', 'offers'] },
    },
    born: { type: 'string', title: 'Born', format: 'date' },
    tags: { type: 'array', title: 'Tags', items: { type: 'string', title: 'Tag' } },
  },
} as const satisfies JSONSchema;

type Values = InferSchema<typeof schema>;

const uiSchema = {
  bio: { 'ui:widget': 'textarea' },
  score: { 'ui:widget': 'range' },
  newsletter: { 'ui:widget': 'switch' },
  size: { 'ui:widget': 'radio' },
};

describe('Tamagui SchemaForm', () => {
  it('renders every widget kind with labels wired to inputs', () => {
    wrap(<SchemaForm schema={schema} uiSchema={uiSchema} />);
    expect(screen.getByText('Profile')).toBeTruthy();
    expect((screen.getByLabelText('Name *') as HTMLInputElement).id).toBe('root_name');
    expect(screen.getByLabelText('Bio').tagName).toBe('TEXTAREA');
    expect((screen.getByLabelText('Email') as HTMLInputElement).type).toBe('email');
    expect((screen.getByLabelText('Born') as HTMLInputElement).type).toBe('date');
    expect(screen.getByLabelText('Subscribed')).toBeTruthy();
    expect(screen.getByLabelText('Newsletter')).toBeTruthy();
    expect(screen.getByLabelText('Plan')).toBeTruthy();
    expect(screen.getByLabelText('m')).toBeTruthy();
    expect(screen.getByLabelText('offers')).toBeTruthy();
    expect(screen.getByText('+ Add')).toBeTruthy();
  });

  it('writes typed values into the store', () => {
    const store = createFormStore<Values>({ schema, uiSchema });
    wrap(<SchemaForm schema={schema} uiSchema={uiSchema} store={store} />);

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '36' } });
    fireEvent.click(screen.getByLabelText('Subscribed'));
    fireEvent.click(screen.getByLabelText('m'));
    fireEvent.click(screen.getByLabelText('offers'));
    fireEvent.click(screen.getByLabelText('news'));

    expect(store.getState().values).toEqual({
      name: 'Ada',
      age: 36,
      subscribed: true,
      size: 'm',
      topics: ['news', 'offers'],
    });

    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '' } });
    expect(store.getState().values).not.toHaveProperty('age');
  });

  it('shows errors on submit and submits once valid', () => {
    const onSubmit = vi.fn();
    wrap(<SchemaForm schema={schema} uiSchema={uiSchema} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('is a required property');
    expect(screen.getByLabelText('Name *').getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Ada' } });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' });
  });

  it('adds, edits and removes array items', () => {
    const store = createFormStore<Values>({ schema, uiSchema });
    wrap(<SchemaForm schema={schema} uiSchema={uiSchema} store={store} />);
    fireEvent.click(screen.getByText('+ Add'));
    fireEvent.click(screen.getByText('+ Add'));
    const [first] = screen.getAllByLabelText('Tag');
    fireEvent.change(first as HTMLElement, { target: { value: 'x' } });
    expect(store.getState().values.tags).toEqual(['x', undefined]);
    fireEvent.click(screen.getByLabelText('Remove item 1'));
    expect(store.getState().values.tags).toEqual([undefined]);
  });

  it('keeps partially typed numbers and follows external resets', () => {
    const store = createFormStore<Values>({ schema, uiSchema });
    wrap(<SchemaForm schema={schema} uiSchema={uiSchema} store={store} />);
    const age = () => screen.getByLabelText('Age') as HTMLInputElement;
    fireEvent.change(age(), { target: { value: '-' } });
    expect(age().value).toBe('-');
    expect(store.getState().values).not.toHaveProperty('age');
    act(() => store.getState().reset({ age: 7 }));
    expect(age().value).toBe('7');
  });
});

describe('date/time conversions', () => {
  const validator = createAjvValidator();

  it('round-trips datetime-local values through valid RFC 3339 strings', () => {
    const iso = localToIso('2026-10-17T09:30');
    expect(validator.validate({ type: 'string', format: 'date-time' }, iso).valid).toBe(true);
    expect(isoToLocal(iso)).toBe('2026-10-17T09:30');
    expect(localToIso('garbage')).toBe('garbage');
  });

  it('accepts the time widget output', () => {
    const time = localToFullTime('09:30');
    expect(time).toMatch(/^09:30:00[+-]\d\d:\d\d$/);
    expect(validator.validate({ type: 'string', format: 'time' }, time).valid).toBe(true);
  });
});
