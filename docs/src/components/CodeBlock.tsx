import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { SizableText, XStack, YStack } from 'tamagui';

export interface CodeBlockProps {
  readonly label: string;
  readonly value: string;
  readonly onChange?: (value: string) => void;
  readonly error?: string | undefined;
  readonly language?: 'json' | 'tsx';
  readonly dark: boolean;
  readonly height?: string;
  readonly actions?: React.ReactNode;
}

/** CodeMirror editor (or read-only viewer when `onChange` is absent). */
export function CodeBlock({
  label,
  value,
  onChange,
  error,
  language = 'json',
  dark,
  height = '100%',
  actions,
}: CodeBlockProps) {
  const extensions = useMemo(
    () => [
      language === 'json' ? json() : javascript({ jsx: true, typescript: true }),
      EditorView.lineWrapping,
    ],
    [language],
  );
  return (
    <YStack
      flex={1}
      minHeight={0}
      borderWidth={1}
      borderColor={error ? 'red8' : 'border-color'}
      borderRadius="4"
      overflow="hidden"
    >
      <XStack
        paddingHorizontal="3"
        paddingVertical="2"
        alignItems="center"
        gap="2"
        backgroundColor="color2"
        borderBottomWidth={1}
        borderColor="border-color"
      >
        <SizableText size="3" fontWeight="600" flex={1}>
          {label}
        </SizableText>
        {error ? (
          <SizableText size="2" theme="red" color="color10" numberOfLines={1} flexShrink={1}>
            {error}
          </SizableText>
        ) : (
          actions
        )}
      </XStack>
      <YStack flex={1} minHeight={0} overflow="hidden">
        <CodeMirror
          value={value}
          height={height}
          style={{ height: '100%', fontSize: 13 }}
          theme={dark ? 'dark' : 'light'}
          extensions={extensions}
          editable={onChange !== undefined}
          readOnly={onChange === undefined}
          basicSetup={{ foldGutter: true, highlightActiveLine: onChange !== undefined }}
          {...(onChange && { onChange })}
        />
      </YStack>
    </YStack>
  );
}
