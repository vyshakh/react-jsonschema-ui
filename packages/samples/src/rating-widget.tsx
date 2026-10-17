import type { WidgetProps } from 'react-jsonschema-ui';
import { Button, XStack } from 'tamagui';

export function RatingWidget({
  id,
  value,
  onChange,
  onBlur,
  node,
  disabled,
  readOnly,
}: WidgetProps<number | undefined>) {
  const max = node.schema.maximum ?? 5;
  return (
    <XStack id={id} gap="$1">
      {Array.from({ length: max }, (_, i) => (
        <Button
          // biome-ignore lint/suspicious/noArrayIndexKey: stars are positional.
          key={i}
          size="$4"
          chromeless
          disabled={disabled || readOnly}
          aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
          onPress={() => {
            onChange(i + 1);
            onBlur();
          }}
        >
          {i < (value ?? 0) ? '★' : '☆'}
        </Button>
      ))}
    </XStack>
  );
}
