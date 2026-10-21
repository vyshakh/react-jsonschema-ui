// @vitest-environment jsdom
import { animations } from '@tamagui/config/v5-css';
import { defaultConfig } from '@tamagui/config/v6';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createTamagui, TamaguiProvider } from 'tamagui';
import { afterEach, expect, it, vi } from 'vitest';
import { SchemaForm } from './index';

// Tamagui 3's default config pack, with an animation driver so the select
// mounts its adaptive sheet. tamagui.test.tsx covers the v5 pack without one.
const config = createTamagui({ ...defaultConfig, animations });

afterEach(cleanup);

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', title: 'Name' },
    plan: { type: 'string', title: 'Plan', enum: ['free', 'pro'] },
    agree: { type: 'boolean', title: 'Agree' },
    tags: { type: 'array', title: 'Tags', items: { type: 'string', title: 'Tag' } },
  },
} as const;

it('renders and submits under the v6 config pack', () => {
  const onSubmit = vi.fn();
  render(
    <TamaguiProvider config={config} defaultTheme="dark">
      <SchemaForm
        schema={schema}
        uiSchema={{ agree: { 'ui:widget': 'switch' } }}
        onSubmit={onSubmit}
      />
    </TamaguiProvider>,
  );
  expect(screen.getByLabelText('Plan')).toBeTruthy();
  fireEvent.click(screen.getByText('Submit'));
  expect(screen.getByRole('alert').textContent).toBe('is a required property');

  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByLabelText('Agree'));
  fireEvent.click(screen.getByText('+ Add'));
  fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'x' } });
  fireEvent.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', agree: true, tags: ['x'] });
});
