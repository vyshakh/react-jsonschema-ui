import { useCallback, useMemo } from 'react';
import {
  Adapt,
  Checkbox,
  Label,
  RadioGroup,
  Select,
  Sheet,
  SizableText,
  XStack,
  YStack,
} from 'tamagui';
import type { EnumOption } from '../../parser/parse';
import type { WidgetProps } from '../../registry/types';

// Tamagui choice components key items by string; enum values can be any JSON
// value, so options are addressed by their index.

const NONE = '';

function indexOf(options: readonly EnumOption[], value: unknown): string {
  const index = options.findIndex((option) => Object.is(option.value, value));
  return index === -1 ? NONE : String(index);
}

function valueAt(options: readonly EnumOption[], key: string): unknown {
  return key === NONE ? undefined : options[Number(key)]?.value;
}

/**
 * Popover list on web; on touch devices it adapts to a bottom sheet, since
 * Tamagui's Select renders no dropdown of its own on native.
 */
export function SelectWidget({
  id,
  value,
  onChange,
  onBlur,
  enumOptions,
  placeholder,
  disabled,
  readOnly,
  label,
}: WidgetProps) {
  const options = enumOptions ?? [];
  const onValueChange = useCallback(
    (key: string) => {
      onChange(valueAt(options, key));
      onBlur();
    },
    [options, onChange, onBlur],
  );

  return (
    <Select
      id={id}
      value={indexOf(options, value)}
      onValueChange={onValueChange}
      disablePreventBodyScroll
    >
      <Select.Trigger disabled={disabled || readOnly} aria-label={label}>
        <Select.Value placeholder={placeholder ?? 'Select…'} />
      </Select.Trigger>

      <Adapt platform="touch">
        <Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Adapt>

      <Select.Content>
        <Select.Viewport minWidth={200}>
          <Select.Group>
            {options.map((option, index) => (
              <Select.Item key={option.label} index={index} value={String(index)}>
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator marginLeft="auto">
                  <SizableText>✓</SizableText>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
}

export function RadioWidget({
  id,
  value,
  onChange,
  onBlur,
  enumOptions,
  disabled,
  readOnly,
  options: uiOptions,
}: WidgetProps) {
  const options = enumOptions ?? [];
  const onValueChange = useCallback(
    (key: string) => {
      onChange(valueAt(options, key));
      onBlur();
    },
    [options, onChange, onBlur],
  );
  const Stack = uiOptions.inline === true ? XStack : YStack;
  return (
    <RadioGroup
      id={id}
      value={indexOf(options, value)}
      onValueChange={onValueChange}
      disabled={disabled || readOnly}
    >
      <Stack gap="$2" flexWrap="wrap">
        {options.map((option, index) => {
          const itemId = `${id}__${index}`;
          return (
            <XStack key={option.label} gap="$2" alignItems="center">
              <RadioGroup.Item id={itemId} value={String(index)} size="$3">
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Label htmlFor={itemId} size="$3">
                {option.label}
              </Label>
            </XStack>
          );
        })}
      </Stack>
    </RadioGroup>
  );
}

/** Multi-select for `type: array` with enum items (`ui:widget: 'checkboxes'`). */
export function CheckboxesWidget({
  id,
  value,
  onChange,
  onBlur,
  enumOptions,
  disabled,
  readOnly,
  options: uiOptions,
}: WidgetProps<unknown[] | undefined>) {
  const options = enumOptions ?? [];
  const selected = useMemo(() => new Set(value ?? []), [value]);
  const toggle = (option: EnumOption, checked: boolean) => {
    // Rebuild in option order so the stored array is deterministic.
    const next = options
      .filter((o) => (o === option ? checked : selected.has(o.value)))
      .map((o) => o.value);
    onChange(next.length > 0 ? next : undefined);
    onBlur();
  };
  const Stack = uiOptions.inline === true ? XStack : YStack;
  return (
    <Stack id={id} gap="$2" flexWrap="wrap">
      {options.map((option, index) => {
        const itemId = `${id}__${index}`;
        return (
          <XStack key={option.label} gap="$2" alignItems="center">
            <Checkbox
              id={itemId}
              size="$4"
              checked={selected.has(option.value)}
              onCheckedChange={(checked) => toggle(option, checked === true)}
              disabled={disabled || readOnly}
            >
              <Checkbox.Indicator>
                <SizableText size="$3">✓</SizableText>
              </Checkbox.Indicator>
            </Checkbox>
            <Label htmlFor={itemId} size="$3">
              {option.label}
            </Label>
          </XStack>
        );
      })}
    </Stack>
  );
}
