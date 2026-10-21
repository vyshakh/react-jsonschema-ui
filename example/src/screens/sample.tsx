import type { Sample } from '@react-jsonschema-ui/samples';
import { useState } from 'react';
import type { ErrorMap } from 'react-jsonschema-ui';
import { SchemaForm } from 'react-jsonschema-ui';
import { ScrollView } from 'react-native';
import { Paragraph, SizableText, YStack } from 'tamagui';

type Result =
  | { readonly ok: true; readonly values: unknown }
  | { readonly ok: false; readonly errors: ErrorMap };

export function SampleScreen({ sample }: { sample: Sample }) {
  const [values, setValues] = useState<unknown>(sample.formData);
  const [result, setResult] = useState<Result>();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <YStack padding="4" gap="5">
        <Paragraph size="3" color="color10">
          {sample.description}
        </Paragraph>

        <SchemaForm
          schema={sample.schema}
          {...(sample.uiSchema && { uiSchema: sample.uiSchema })}
          {...(sample.registry && { registry: sample.registry })}
          initialValues={sample.formData as never}
          onChange={setValues}
          onSubmit={(submitted) => setResult({ ok: true, values: submitted })}
          onError={(errors) => setResult({ ok: false, errors })}
        />

        {result && (
          <Panel
            theme={result.ok ? 'green' : 'red'}
            title={result.ok ? 'Submitted' : 'Fix the highlighted fields'}
            body={result.ok ? result.values : result.errors}
          />
        )}

        <Panel title="Live values" body={values ?? {}} />
      </YStack>
    </ScrollView>
  );
}

function Panel({ title, body, theme }: { title: string; body: unknown; theme?: 'green' | 'red' }) {
  return (
    <YStack
      theme={theme ?? null}
      backgroundColor="color2"
      borderRadius="4"
      borderWidth={1}
      borderColor="border-color"
      padding="3"
      gap="2"
    >
      <SizableText size="3" fontWeight="600" color="color11">
        {title}
      </SizableText>
      <SizableText size="2" fontFamily="body" color="color12" userSelect="text">
        {JSON.stringify(body, null, 2)}
      </SizableText>
    </YStack>
  );
}

export function NotFound({ id }: { id: string | undefined }) {
  return (
    <YStack flex={1} padding="4" alignItems="center" justifyContent="center">
      <Paragraph>{`No sample named "${id ?? ''}".`}</Paragraph>
    </YStack>
  );
}
