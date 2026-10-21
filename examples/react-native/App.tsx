import { useState } from 'react';
import { SchemaForm, type UiSchema } from 'react-jsonschema-ui';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// A plain React Native CLI app with no Tamagui setup at all: no
// createTamagui, no <TamaguiProvider>, no Babel or Metro plugin. <SchemaForm>
// falls back to its built-in config.

// The README quick start, as pasted.
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
    seat: { type: 'string', title: 'Seat', enum: ['aisle', 'window'] },
    extras: {
      type: 'array',
      title: 'Extras',
      uniqueItems: true,
      items: { type: 'string', enum: ['bag', 'meal'] },
    },
    travellers: { type: 'array', title: 'Travellers', items: { type: 'string', title: 'Name' } },
  },
} as const;

const tripUi: UiSchema = {
  nights: { 'ui:widget': 'range' },
  seat: { 'ui:widget': 'radio', 'ui:options': { inline: true } },
  extras: { 'ui:widget': 'checkboxes' },
};

export default function App() {
  const [saved, setSaved] = useState<unknown>();
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SchemaForm schema={signUp} uiSchema={signUpUi} onSubmit={setSaved} />
          <SchemaForm schema={trip} uiSchema={tripUi} onSubmit={setSaved} />
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Last submit</Text>
            <Text testID="saved" selectable>
              {saved === undefined ? '–' : JSON.stringify(saved, null, 2)}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#faf9fb' },
  content: { padding: 20, gap: 32 },
  result: { gap: 8 },
  resultTitle: { fontWeight: '600' },
});
