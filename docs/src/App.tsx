import { samples } from '@react-jsonschema-ui/samples';
import { useCallback, useMemo, useState } from 'react';
import { Button, Paragraph, ScrollView, SizableText, XStack, YStack } from 'tamagui';
import { CodeBlock } from './components/CodeBlock';
import { generateCode } from './components/codegen';
import { FormPreview } from './components/FormPreview';
import { OptionsPanel } from './components/OptionsPanel';
import { encodeShared, readHash, usePlayground } from './state';

type Tab = 'form' | 'code';

const REPO_URL = 'https://github.com/vyshakh/react-jsonschema-ui';

function GitHubIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="var(--color)" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

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
    <YStack minHeight="100vh" backgroundColor="background">
      <XStack
        paddingHorizontal="4"
        paddingVertical="3"
        alignItems="center"
        gap="3"
        borderBottomWidth={1}
        borderColor="border-color"
        flexWrap="wrap"
      >
        <YStack flex={1} minWidth={240}>
          <SizableText size="6" fontWeight="700">
            react-jsonschema-ui
          </SizableText>
          <Paragraph size="2" color="color10">
            JSON Schema forms for React Native and the web, rendered with Tamagui.
          </Paragraph>
        </YStack>
        <Button size="sm" onPress={share}>
          {copied === 'link' ? 'Link copied' : 'Share'}
        </Button>
        <Button
          size="sm"
          icon={<GitHubIcon />}
          render={
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            />
          }
          role="link"
          aria-label="GitHub repository"
        >
          GitHub
        </Button>
        <Button size="sm" onPress={onToggleDark} aria-label="Toggle dark mode">
          {dark ? '☀︎ Light' : '☾ Dark'}
        </Button>
      </XStack>

      <XStack flexGrow={1} flexWrap="wrap" alignItems="flex-start">
        <YStack
          width={200}
          padding="3"
          gap="1"
          borderRightWidth={1}
          borderColor="border-color"
          $max-md={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', borderRightWidth: 0 }}
          role="navigation"
          aria-label="Samples"
        >
          {samples.map((sample) => {
            const active = state.sample?.id === sample.id;
            return (
              <Button
                key={sample.id}
                size="sm"
                justifyContent="flex-start"
                {...(!active && { variant: 'quiet' as const })}
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

        <YStack flex={1} minWidth={340} padding="3" gap="3">
          {state.sample && (
            <Paragraph size="3" color="color11">
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
          <XStack gap="3" flexDirection="row max-sm:column" height="300px max-sm:620px">
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

        <YStack flex={1} minWidth={340} padding="3" gap="3">
          <XStack gap="2" role="tablist" alignItems="center" flexWrap="wrap">
            {(['form', 'code'] as const).map((id) => (
              <Button
                key={id}
                size="sm"
                role="tab"
                aria-selected={tab === id}
                theme={tab === id ? 'accent' : null}
                onPress={() => setTab(id)}
              >
                {id === 'form' ? 'Form' : 'Code'}
              </Button>
            ))}
          </XStack>
          <YStack borderWidth={1} borderColor="border-color" borderRadius="4" padding="3">
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
                  <Button size="xs" onPress={() => void copy('code', code)}>
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
