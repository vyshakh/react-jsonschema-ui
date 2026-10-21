'use client';

// <SchemaForm> takes callbacks, so it renders from a client component.
import { useState } from 'react';
import { SchemaForm, type UiSchema } from 'react-jsonschema-ui';
import { Paragraph, SizableText, YStack } from 'tamagui';

// The README quick start.
const signUp = {
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

const signUpUi: UiSchema = {
  newsletter: { 'ui:widget': 'switch' },
};

const trip = {
  title: 'Trip',
  type: 'object',
  required: ['destination'],
  properties: {
    destination: { type: 'string', title: 'Destination' },
    nights: { type: 'integer', title: 'Nights', minimum: 1, maximum: 30, default: 3 },
    cabin: { type: 'string', title: 'Cabin', enum: ['economy', 'business'] },
    extras: {
      type: 'array',
      title: 'Extras',
      uniqueItems: true,
      items: { type: 'string', enum: ['bag', 'meal', 'seat'] },
    },
    travellers: {
      type: 'array',
      title: 'Travellers',
      items: { type: 'string', title: 'Name' },
    },
  },
} as const;

const tripUi: UiSchema = {
  nights: { 'ui:widget': 'range' },
  extras: { 'ui:widget': 'checkboxes' },
};

export function Forms() {
  const [saved, setSaved] = useState<unknown>();
  return (
    <YStack backgroundColor="background" minHeight="100vh" alignItems="center" padding="6">
      <YStack width="100%" maxWidth={560} gap="8">
        <SchemaForm schema={signUp} uiSchema={signUpUi} onSubmit={setSaved} />
        <SchemaForm schema={trip} uiSchema={tripUi} onSubmit={setSaved} />
        <YStack gap="2">
          <SizableText fontWeight="600">Last submit</SizableText>
          <Paragraph data-testid="saved" whiteSpace="pre-wrap">
            {saved === undefined ? '–' : JSON.stringify(saved, null, 2)}
          </Paragraph>
        </YStack>
      </YStack>
    </YStack>
  );
}
