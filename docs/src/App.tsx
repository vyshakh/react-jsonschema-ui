import { samples } from '@react-jsonschema-ui/samples';
import { useCallback, useMemo, useState } from 'react';
import { Button, Paragraph, ScrollView, SizableText, XStack, YStack } from 'tamagui';
import { CodeBlock } from './components/CodeBlock';
import { generateCode } from './components/codegen';
import { FormPreview } from './components/FormPreview';
import { OptionsPanel } from './components/OptionsPanel';
import { encodeShared, readHash, usePlayground } from './state';

type Tab = 'form' | 'code';

export function App({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const [state, dispatch] = usePlayground(readHash());
  const [tab, setTab] = useState<Tab>('form');
  const [copied, setCopied] = useState<'link' | 'code'>();

  const code = useMemo(() => (tab === 'code' ? generateCode(state) : ''), [tab, state]);

  const onFormChange = useCallback(
    (values: unknown) => dispatch({ type: 'formChanged', values }),
    [dispatch],
  );

  const copy = async (what: 'link' | 'code', text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(undefined), 1500);
  };

  const share = () => {
    const hash = `state=${encodeShared({
      schema: state.schema.text,
      uiSchema: state.uiSchema.text,
      formData: state.formData.text,
    })}`;
    window.history.replaceState(null, '', `#${hash}`);
    void copy('link', window.location.href);
  };

  return (
    <YStack minHeight="100vh" backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        flexWrap="wrap"
      >
        <YStack flex={1} minWidth={240}>
          <SizableText size="$6" fontWeight="700">
            react-jsonschema-ui
          </SizableText>
          <Paragraph size="$2" color="$color10">
            JSON Schema forms for React Native and the web, rendered with Tamagui.
          </Paragraph>
        </YStack>
        <Button size="$3" onPress={share}>
          {copied === 'link' ? 'Link copied' : 'Share'}
        </Button>
        <Button size="$3" onPress={onToggleDark} aria-label="Toggle dark mode">
          {dark ? '☀︎ Light' : '☾ Dark'}
        </Button>
      </XStack>

      <XStack flex={1} flexWrap="wrap" alignItems="flex-start">
        <YStack
          width={200}
          padding="$3"
          gap="$1"
          borderRightWidth={1}
          borderColor="$borderColor"
          $max-md={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', borderRightWidth: 0 }}
          role="navigation"
          aria-label="Samples"
        >
          {samples.map((sample) => {
            const active = state.sample?.id === sample.id;
            return (
              <Button
                key={sample.id}
                size="$3"
                justifyContent="flex-start"
                chromeless={!active}
                theme={active ? 'accent' : null}
                aria-current={active ? 'page' : undefined}
                onPress={() => {
                  window.history.replaceState(null, '', `#sample=${sample.id}`);
                  dispatch({ type: 'loadSample', sample });
                }}
              >
                {sample.title}
              </Button>
            );
          })}
        </YStack>

        <YStack flex={1} minWidth={340} padding="$3" gap="$3">
          {state.sample && (
            <Paragraph size="$3" color="$color11">
              {state.sample.description}
            </Paragraph>
          )}
          <YStack height={440}>
            <CodeBlock
              label="JSON Schema"
              value={state.schema.text}
              error={state.schema.error}
              onChange={(text) => dispatch({ type: 'editSchema', text })}
              dark={dark}
            />
          </YStack>
          <XStack gap="$3" height={300} $max-sm={{ flexDirection: 'column', height: 620 }}>
            <CodeBlock
              label="UI Schema"
              value={state.uiSchema.text}
              error={state.uiSchema.error}
              onChange={(text) => dispatch({ type: 'editUiSchema', text })}
              dark={dark}
            />
            <CodeBlock
              label="Form data"
              value={state.formData.text}
              error={state.formData.error}
              onChange={(text) => dispatch({ type: 'editFormData', text })}
              dark={dark}
            />
          </XStack>
        </YStack>

        <YStack flex={1} minWidth={340} padding="$3" gap="$3">
          <XStack gap="$2" role="tablist" alignItems="center" flexWrap="wrap">
            {(['form', 'code'] as const).map((id) => (
              <Button
                key={id}
                size="$3"
                role="tab"
                aria-selected={tab === id}
                theme={tab === id ? 'accent' : null}
                onPress={() => setTab(id)}
              >
                {id === 'form' ? 'Form' : 'Code'}
              </Button>
            ))}
          </XStack>
          <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$3">
            <OptionsPanel
              options={state.options}
              onChange={(options) => dispatch({ type: 'setOptions', options })}
            />
          </YStack>
          {tab === 'form' ? (
            <ScrollView>
              <FormPreview state={state} onFormChange={onFormChange} />
            </ScrollView>
          ) : (
            <YStack height={640}>
              <CodeBlock
                label="Usage"
                language="tsx"
                value={code}
                dark={dark}
                actions={
                  <Button size="$2" onPress={() => void copy('code', code)}>
                    {copied === 'code' ? 'Copied' : 'Copy'}
                  </Button>
                }
              />
            </YStack>
          )}
        </YStack>
      </XStack>
    </YStack>
  );
}
