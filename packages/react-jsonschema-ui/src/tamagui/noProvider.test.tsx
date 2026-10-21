// @vitest-environment jsdom
import { defaultConfig } from '@tamagui/config/v5';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createTamagui } from 'tamagui';
import { afterEach, expect, it, vi } from 'vitest';
import { SchemaForm } from './index';

// The app created a config but renders the form outside <TamaguiProvider>:
// the form provides one with the app's config.
createTamagui(defaultConfig);

afterEach(cleanup);

it('renders with the app config when there is no provider', () => {
  const onSubmit = vi.fn();
  render(
    <SchemaForm
      schema={{
        type: 'object',
        properties: {
          plan: { type: 'string', title: 'Plan', enum: ['free', 'pro'], default: 'pro' },
          agree: { type: 'boolean', title: 'Agree' },
        },
      }}
      uiSchema={{ agree: { 'ui:widget': 'switch' } }}
      onSubmit={onSubmit}
    />,
  );
  fireEvent.click(screen.getByLabelText('Agree'));
  fireEvent.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({ plan: 'pro', agree: true });
});
