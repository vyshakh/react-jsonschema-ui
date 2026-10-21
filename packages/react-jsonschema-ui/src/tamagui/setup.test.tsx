// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SchemaForm, type UiSchema } from '../index';

// No createTamagui and no <TamaguiProvider> in this file: the README quick
// start must render and submit as pasted.

afterEach(cleanup);

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

it('renders and submits without an app Tamagui config', () => {
  const save = vi.fn();
  render(<SchemaForm schema={schema} uiSchema={uiSchema} onSubmit={(values) => save(values)} />);

  fireEvent.click(screen.getByText('Submit'));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getAllByRole('alert')).toHaveLength(2);

  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Ada' } });
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'ada@example.com' } });
  fireEvent.click(screen.getByLabelText('Send me updates'));
  fireEvent.click(screen.getByText('Submit'));
  expect(save).toHaveBeenCalledWith({
    name: 'Ada',
    email: 'ada@example.com',
    plan: 'free',
    newsletter: true,
  });
});

it('keeps working across re-renders and several forms', () => {
  const { rerender } = render(<SchemaForm schema={schema} />);
  rerender(<SchemaForm schema={schema} submitLabel="Join" />);
  render(<SchemaForm schema={schema} />);
  expect(screen.getByText('Join')).toBeTruthy();
  expect(screen.getAllByText('Sign up')).toHaveLength(2);
});
