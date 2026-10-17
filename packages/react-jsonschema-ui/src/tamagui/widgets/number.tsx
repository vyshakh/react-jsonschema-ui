import { useCallback, useState } from 'react';
import { Input, SizableText, Slider, XStack } from 'tamagui';
import type { WidgetProps } from '../../registry/types';

/**
 * Keeps the typed text locally so intermediate input ("-", "1.", "") survives
 * while the stored value only ever holds numbers. When the value changes from
 * outside (reset, external store), the text follows it.
 */
export function NumberWidget({
  id,
  node,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  readOnly,
  autofocus,
  errors,
}: WidgetProps<number | undefined>) {
  const [text, setText] = useState(() => toText(value));
  const shown = Object.is(parseNumber(text), value) ? text : toText(value);

  const onChangeText = useCallback(
    (next: string) => {
      setText(next);
      const parsed = parseNumber(next);
      if (parsed !== undefined || next.trim() === '') onChange(parsed);
    },
    [onChange],
  );

  const invalid = errors !== undefined && errors.length > 0;
  return (
    <Input
      id={id}
      // Not type="number": browsers blank out partial input such as "-".
      inputMode={node.kind === 'integer' ? 'numeric' : 'decimal'}
      value={shown}
      onChangeText={onChangeText}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      autoFocus={autofocus}
      {...(placeholder !== undefined && {
        placeholder,
        placeholderTextColor: '$placeholderColor' as const,
      })}
      {...(invalid && { 'aria-invalid': true, borderColor: '$red8' as const })}
    />
  );
}

/** Slider over `minimum`..`maximum` (default 0..100), stepping by `multipleOf` or 1. */
export function RangeWidget({
  id,
  node,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  label,
}: WidgetProps<number | undefined>) {
  const { minimum = 0, maximum = 100, multipleOf } = node.schema;
  const step = multipleOf ?? (node.kind === 'integer' ? 1 : (maximum - minimum) / 100);
  const current = value ?? minimum;
  const onValueChange = useCallback((values: number[]) => onChange(values[0]), [onChange]);
  return (
    <XStack gap="$3" alignItems="center">
      <Slider
        id={id}
        flex={1}
        min={minimum}
        max={maximum}
        step={step}
        value={[current]}
        onValueChange={onValueChange}
        onSlideEnd={onBlur}
        disabled={disabled || readOnly}
        aria-label={label}
      >
        <Slider.Track>
          <Slider.TrackActive />
        </Slider.Track>
        <Slider.Thumb index={0} circular size="$1" />
      </Slider>
      <SizableText size="$3" minWidth="$3" textAlign="right">
        {value === undefined ? '–' : String(value)}
      </SizableText>
    </XStack>
  );
}

function toText(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
