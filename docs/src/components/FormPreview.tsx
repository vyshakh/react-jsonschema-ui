import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAjvValidator,
  createFormStore,
  type ErrorMap,
  type FormStore,
  SchemaForm,
} from 'react-jsonschema-ui';
import { Paragraph, SizableText, XStack, YStack } from 'tamagui';
import { useStore } from 'zustand';
import type { PlaygroundState } from '../state';

const validator = createAjvValidator();

type Submission =
  | { readonly ok: true; readonly at: Date; readonly values: unknown }
  | { readonly ok: false; readonly at: Date; readonly errors: ErrorMap };

export interface FormPreviewProps {
  readonly state: PlaygroundState;
  readonly onFormChange: (values: unknown) => void;
}

export function FormPreview({ state, onFormChange }: FormPreviewProps) {
  const { schema, uiSchema, formData, formVersion, options, sample } = state;

  // Latest values seed a rebuilt store, so editing the schema keeps what was typed.
  const latestValues = useRef(formData.value);
  latestValues.current = formData.value;

  const built = useMemo(():
    | { store: FormStore; error?: undefined }
    | { store?: undefined; error: string } => {
    void formVersion; // rebuild when form data is replaced from the editor
    try {
      // Compile up front so an invalid schema is reported here, not on first keystroke.
      validator.validate(schema.value, latestValues.current);
      return {
        store: createFormStore({
          schema: schema.value,
          uiSchema: uiSchema.value,
          validator,
          validateMode: options.validateMode,
          initialValues: latestValues.current as never,
        }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [schema.value, uiSchema.value, formVersion, options.validateMode]);

  const [submission, setSubmission] = useState<Submission>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: a rebuilt form clears the last submission.
  useEffect(() => setSubmission(undefined), [built]);

  // Mirror schema defaults filled in at store creation back into the editor.
  useEffect(() => {
    const values = built.store?.getState().values;
    if (values !== undefined && JSON.stringify(values) !== JSON.stringify(latestValues.current)) {
      onFormChange(values);
    }
  }, [built, onFormChange]);

  if (built.error !== undefined) return <Problem title="Invalid schema" message={built.error} />;

  return (
    <YStack gap="$4">
      <YStack
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        padding="$4"
        backgroundColor="$background"
      >
        <PreviewBoundary resetKey={built.store}>
          <SchemaForm
            schema={schema.value}
            uiSchema={uiSchema.value}
            store={built.store}
            validator={validator}
            disabled={options.disabled}
            readOnly={options.readOnly}
            {...(sample?.registry && { registry: sample.registry })}
            onChange={onFormChange}
            onSubmit={(values) => setSubmission({ ok: true, at: new Date(), values })}
            onError={(errors) => setSubmission({ ok: false, at: new Date(), errors })}
          />
        </PreviewBoundary>
      </YStack>
      <LiveErrors store={built.store} />
      {submission && <SubmissionResult submission={submission} />}
    </YStack>
  );
}

function LiveErrors({ store }: { store: FormStore }) {
  const errors = useStore(store, (s) => s.errors);
  const entries = Object.entries(errors);
  return (
    <YStack gap="$1">
      <SizableText size="$3" fontWeight="600">
        {`Visible errors (${entries.length})`}
      </SizableText>
      {entries.length === 0 ? (
        <Paragraph size="$2" color="$color10">
          None. Errors appear as fields are visited, according to the validate mode.
        </Paragraph>
      ) : (
        entries.map(([pointer, messages]) => (
          <XStack key={pointer} gap="$2">
            <SizableText size="$2" fontFamily="$mono" color="$color11">
              {pointer || '(root)'}
            </SizableText>
            <SizableText size="$2" theme="red" color="$color10" flexShrink={1}>
              {messages.join('; ')}
            </SizableText>
          </XStack>
        ))
      )}
    </YStack>
  );
}

function SubmissionResult({ submission }: { submission: Submission }) {
  const time = submission.at.toLocaleTimeString();
  return (
    <YStack
      theme={submission.ok ? 'green' : 'red'}
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      padding="$3"
      gap="$2"
    >
      <SizableText size="$3" fontWeight="600" color="$color11">
        {submission.ok ? `Submitted at ${time}` : `Submit blocked at ${time}`}
      </SizableText>
      <SizableText size="$2" fontFamily="$mono" whiteSpace="pre-wrap" color="$color12">
        {JSON.stringify(submission.ok ? submission.values : submission.errors, null, 2)}
      </SizableText>
    </YStack>
  );
}

function Problem({ title, message }: { title: string; message: string }) {
  return (
    <YStack theme="red" backgroundColor="$background" borderRadius="$4" padding="$4" gap="$2">
      <SizableText size="$4" fontWeight="600" color="$color11">
        {title}
      </SizableText>
      <SizableText size="$2" fontFamily="$mono" color="$color11">
        {message}
      </SizableText>
    </YStack>
  );
}

/** Keeps a schema that breaks rendering from taking the playground down. */
class PreviewBoundary extends Component<
  { resetKey: unknown; children: ReactNode },
  { error: Error | undefined; resetKey: unknown }
> {
  override state = { error: undefined as Error | undefined, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey: unknown },
    state: { error: Error | undefined; resetKey: unknown },
  ) {
    return props.resetKey === state.resetKey
      ? null
      : { error: undefined, resetKey: props.resetKey };
  }

  override render() {
    return this.state.error ? (
      <Problem title="Render error" message={this.state.error.message} />
    ) : (
      this.props.children
    );
  }
}
